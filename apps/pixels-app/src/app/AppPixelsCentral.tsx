import { assert, unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  PixelMutableProps,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { reaction } from "mobx";
import React from "react";
import { Alert } from "react-native";

import { useAppSelector, useAppStore } from "./hooks";
import { AppStore, pairedDiceSelectors } from "./store";

import {
  PixelsCentral,
  PixelsCentralEventMap,
  PixelSchedulerEventMap,
} from "~/features/dice";
import {
  createProfileDataSetWithOverrides,
  getWebRequestPayload,
  playActionMakeWebRequest,
  playActionSpeakText,
} from "~/features/profiles";
import { addDieRoll } from "~/features/store/diceStatsSlice";
import {
  updatePairedDieFirmwareTimestamp,
  updatePairedDieName,
  updatePairedDieProfileHash,
} from "~/features/store/pairedDiceSlice";
import { readProfile } from "~/features/store/profiles";
import {
  commitEditableProfile,
  EditableProfileStore,
  EditableProfileStoreGetterContext,
  PixelsCentralContext,
  useConnectToMissingPixels,
  usePixelsCentralOnReady,
} from "~/hooks";

function alertRenameFailed(error: Error) {
  Alert.alert(
    "Failed to Rename Die",
    "An error occurred while renaming the die\n" + String(error),
    [{ text: "OK", style: "default" }]
  );
}

function remoteActionListener(
  pixel: Pixel,
  actionId: number,
  store: AppStore
): void {
  const state = store.getState();
  const profileUuid = pairedDiceSelectors.selectByPixelId(
    state,
    pixel.pixelId
  )?.profileUuid;
  const log = (msg: string) => `[Pixel ${pixel.name}] ${msg}`;
  if (profileUuid) {
    const profile = readProfile(profileUuid, state.library);
    const action = profile.getRemoteAction(actionId);
    if (action) {
      console.log(
        log(`Got remote action of type ${action.type} with id ${actionId}`)
      );
      if (action instanceof Profiles.ActionMakeWebRequest) {
        playActionMakeWebRequest(
          action,
          pixel.dieType,
          getWebRequestPayload(pixel, profile.name, action.value)
        );
      } else if (action instanceof Profiles.ActionSpeakText) {
        playActionSpeakText(action);
      } else {
        console.log(
          log(`Nothing to do for remote action of type "${action.type}`)
        );
      }
    } else {
      console.warn(log(`No remote action found with id ${actionId}`));
    }
  } else {
    console.warn(
      log(`Skipping remote action with (${profileUuid}) not found)`)
    );
  }
}

function ConnectToMissingPixels({ children }: React.PropsWithChildren) {
  // Scan for paired dice as soon as Central is ready
  const connectToMissingPixels = useConnectToMissingPixels();
  usePixelsCentralOnReady(
    React.useCallback(
      (ready: boolean) => {
        ready && connectToMissingPixels();
      },
      [connectToMissingPixels]
    )
  );
  return <>{children}</>;
}

export function AppPixelsCentral({ children }: React.PropsWithChildren) {
  const store = useAppStore();
  const [central] = React.useState(() => new PixelsCentral());

  // Setup event handlers
  React.useEffect(() => {
    const disposers = new Map<number, () => void>();

    // Hook to Pixel events
    const onPixelFound = ({
      pixel: p,
    }: PixelsCentralEventMap["onPixelFound"]) => {
      const pixel = central.getPixel(p.pixelId);
      assert(pixel, "Pixel not found");

      // Clean up previous event listeners
      disposers.get(pixel.pixelId)?.();

      // Pixel scheduler
      const scheduler = central.getScheduler(pixel.pixelId);

      // Die name
      const onRename = ({ name }: PixelMutableProps) =>
        store.dispatch(
          updatePairedDieName({
            pixelId: pixel.pixelId,
            name,
          })
        );
      pixel.addPropertyListener("name", onRename);

      // Firmware date
      const onFwDate = ({ firmwareDate }: PixelMutableProps) =>
        store.dispatch(
          updatePairedDieFirmwareTimestamp({
            pixelId: pixel.pixelId,
            timestamp: firmwareDate.getTime(),
          })
        );
      pixel.addPropertyListener("firmwareDate", onFwDate);

      // Update name and firmware timestamp on connection
      const onStatus = ({ status }: PixelMutableProps) => {
        if (status === "ready") {
          onRename(pixel);
          onFwDate(pixel);
        }
      };
      pixel.addPropertyListener("status", onStatus);

      // Show errors to user
      const onPixelOp = (ev: PixelSchedulerEventMap["onOperation"]) => {
        if (ev.event.type === "failed") {
          if (ev.operation.type === "rename") {
            alertRenameFailed(ev.event.error);
          }
        }
      };
      scheduler.addEventListener("onOperation", onPixelOp);

      // Profile
      const onProfileHash = ({
        name,
        profileHash: hash,
      }: PixelMutableProps) => {
        console.log(
          `[Pixel ${name}] Profile hash changed to ${unsigned32ToHex(hash)}`
        );
        store.dispatch(
          updatePairedDieProfileHash({
            pixelId: pixel.pixelId,
            hash,
          })
        );
      };
      pixel.addPropertyListener("profileHash", onProfileHash);

      // Rolls
      const onRoll = (roll: number) =>
        store.dispatch(addDieRoll({ pixelId: pixel.pixelId, roll }));
      pixel.addEventListener("roll", onRoll);

      // Remote action
      const onRemoteAction = (actionId: number) =>
        remoteActionListener(pixel, actionId, store);
      pixel.addEventListener("remoteAction", onRemoteAction);

      disposers.set(pixel.pixelId, () => {
        pixel.removePropertyListener("name", onRename);
        pixel.removePropertyListener("firmwareDate", onFwDate);
        pixel.removePropertyListener("status", onStatus);
        pixel.removePropertyListener("profileHash", onProfileHash);
        pixel.removeEventListener("roll", onRoll);
        pixel.removeEventListener("remoteAction", onRemoteAction);
        scheduler.removeEventListener("onOperation", onPixelOp);
      });
    };
    central.addEventListener("onPixelFound", onPixelFound);

    // Unhook from Pixel events
    const onPixelRemoved = ({
      pixel,
    }: PixelsCentralEventMap["onPixelRemoved"]) => {
      disposers.get(pixel.pixelId)?.();
      disposers.delete(pixel.pixelId);
    };
    central.addEventListener("onPixelRemoved", onPixelRemoved);

    return () => {
      for (const dispose of disposers.values()) {
        dispose();
      }
      central.removeEventListener("onPixelFound", onPixelFound);
      central.removeEventListener("onPixelRemoved", onPixelRemoved);
      central.stopScan();
      central.unwatchAll();
    };
  }, [central, store]);

  // Monitor paired dice
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const profilesEntities = useAppSelector(
    (state) => state.library.profiles.entities
  );
  React.useEffect(() => {
    // Update watched pixels
    const pixelIds = pairedDice.map((d) => d.pixelId);
    for (const id of central.watchedPixelsIds) {
      if (!pixelIds.includes(id)) {
        central.unwatch(id);
      }
    }
    for (const id of pixelIds) {
      central.watch(id);
    }
    // Update dice profile if needed
    for (const d of pairedDice) {
      const profileHash = profilesEntities[d.profileUuid]?.hash;
      if (profileHash && profileHash !== d.profileHash) {
        const scheduler = central.getScheduler(d.pixelId);
        const dataSet = createProfileDataSetWithOverrides(
          readProfile(d.profileUuid, store.getState().library),
          store.getState().appSettings.diceBrightnessFactor
        );
        scheduler.schedule({ type: "programProfile", dataSet });
      }
    }
  }, [central, pairedDice, profilesEntities, store]);

  // Profiles edition
  const [editableProfileStoresMap] = React.useState(
    () => new Map<string, EditableProfileStore>()
  );
  const editableProfileStoreGetter = React.useMemo(
    () => ({
      getEditableProfileStore: (profileUuid: string) => {
        const item = editableProfileStoresMap.get(profileUuid);
        if (item) {
          return item;
        } else {
          const profile = readProfile(profileUuid, store.getState().library);
          const profileStore = new EditableProfileStore(profile);
          editableProfileStoresMap.set(profileUuid, profileStore);
          // Auto save dice profiles and update paired die profile hash
          const disposer = reaction(
            () => profileStore.version,
            (version) => {
              if (version > 0) {
                // Find die using with this profile
                const pairedDie = pairedDiceSelectors.selectByProfileUuid(
                  store.getState(),
                  profile.uuid
                );
                if (pairedDie) {
                  // Save die profile
                  commitEditableProfile(profile, store);
                }
              } else {
                disposer();
                editableProfileStoresMap.delete(profileUuid);
              }
            }
          );
          return profileStore;
        }
      },
    }),
    [editableProfileStoresMap, store]
  );

  return (
    <PixelsCentralContext.Provider value={central}>
      <ConnectToMissingPixels>
        <EditableProfileStoreGetterContext.Provider
          value={editableProfileStoreGetter}
        >
          {children}
        </EditableProfileStoreGetterContext.Provider>
      </ConnectToMissingPixels>
    </PixelsCentralContext.Provider>
  );
}
