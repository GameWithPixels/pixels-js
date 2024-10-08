import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import {
  Color,
  ColorUtils,
  Pixel,
  PixelMutableProps,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { reaction } from "mobx";
import React from "react";
import { Alert } from "react-native";

import { useAppSelector, useAppStore } from "./hooks";
import { AppStore, pairedDiceSelectors } from "./store";

import { PixelsCentral } from "~/features/dice";
import {
  createProfileDataSetWithOverrides,
  getWebRequestPayload,
  playActionMakeWebRequest,
  playActionSpeakText,
} from "~/features/profiles";
import {
  addDieRoll,
  addRollerEntry,
  readProfile,
  updatePairedDieBrightness,
  updatePairedDieFirmwareTimestamp,
  updatePairedDieName,
  updatePairedDieProfileHash,
} from "~/features/store";
import { logError } from "~/features/utils";
import { isSameBrightness } from "~/hackGetDieBrightness";
import {
  commitEditableProfile,
  EditableProfileStore,
  EditableProfileStoreGetterContext,
  PixelsCentralContext,
} from "~/hooks";

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

export function AppPixelsCentral({ children }: React.PropsWithChildren) {
  const store = useAppStore();
  const [central] = React.useState(() => new PixelsCentral());

  // Setup event handlers
  React.useEffect(() => {
    const disposers = new Map<number, () => void>();

    // Hook to Pixel events
    const removeOnPixelFound = central.addListener(
      "onPixelFound",
      ({ pixel }) => {
        // Clean up previous event listeners
        disposers.get(pixel.pixelId)?.();

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
            onProfileHash(pixel);
            if (
              store
                .getState()
                .pairedDice.paired.some((d) => d.pixelId === pixel.pixelId)
            ) {
              setCheckProfiles();
            }
          }
        };
        pixel.addPropertyListener("status", onStatus);

        const onOperationDisposer = central.addSchedulerListener(
          pixel.pixelId,
          "onOperationStatus",
          (ev) => {
            if (
              ev.status === "succeeded" &&
              ev.operation.type === "programProfile"
            ) {
              // Update paired die brightness
              store.dispatch(
                updatePairedDieBrightness({
                  pixelId: pixel.pixelId,
                  brightness: ev.operation.dataSet.brightness / 255,
                })
              );
            } else if (ev.status === "failed") {
              // Show dialog on rename error
              if (ev.operation.type === "rename") {
                Alert.alert(
                  "Failed to Rename Die",
                  "An error occurred while renaming the die\n" +
                    String(ev.error),
                  [{ text: "OK", style: "default" }]
                );
              }
            } else if (ev.status === "dropped") {
              if (ev.operation.type !== "connect") {
                logError(`Pixel Scheduler operation ${ev.operation} dropped`);
              }
            }
          }
        );

        // Profile
        const onProfileHash = ({
          pixelId,
          name,
          profileHash: hash,
        }: PixelMutableProps) => {
          const pairedDie = pairedDiceSelectors.selectByPixelId(
            store.getState(),
            pixelId
          );
          if (pairedDie) {
            console.log(
              `[Pixel ${name}] Got profile hash ${unsigned32ToHex(hash)} ` +
                `(stored hash ${unsigned32ToHex(pairedDie.profileHash)})`
            );
            store.dispatch(
              updatePairedDieProfileHash({
                pixelId: pixel.pixelId,
                hash,
              })
            );
          }
        };
        pixel.addPropertyListener("profileHash", onProfileHash);

        // Rolls
        const onRoll = (roll: number) => {
          store.dispatch(addDieRoll({ pixelId: pixel.pixelId, roll }));
          store.dispatch(
            addRollerEntry({
              pixelId: pixel.pixelId,
              dieType: pixel.dieType,
              value: roll,
            })
          );
        };
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
          onOperationDisposer();
        });
      }
    );

    // Unhook from Pixel events
    const removeOnUnregisterPixel = central.addListener(
      "onUnregisterPixel",
      ({ pixelId }) => {
        disposers.get(pixelId)?.();
        disposers.delete(pixelId);
      }
    );

    return () => {
      for (const dispose of disposers.values()) {
        dispose();
      }
      removeOnPixelFound();
      removeOnUnregisterPixel();
      central.unregisterAll();
    };
  }, [central, store]);

  // Update firmware timestamp on scan
  React.useEffect(() => {
    return central.addListener(
      "onPixelScanned",
      ({ notifier: { pixelId, firmwareDate } }) => {
        store.dispatch(
          updatePairedDieFirmwareTimestamp({
            pixelId,
            timestamp: firmwareDate.getTime(),
          })
        );
      }
    );
  }, [central, store]);

  // Monitor paired dice
  const [checkProfiles, setCheckProfiles] = React.useReducer(
    (x) => (x + 1) & 0xffff, // See useForceUpdate()
    0
  );
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const profiles = useAppSelector((state) => state.library.profiles);
  const appBrightness = useAppSelector(
    (state) => state.appSettings.diceBrightnessFactor
  );
  React.useEffect(() => {
    // Paired dice may have changed since the last render
    const newPairedDice = store.getState().pairedDice.paired;
    // Update list of registered Pixels
    const pixelIds = newPairedDice.map((d) => d.pixelId);
    for (const id of central.registeredPixelsIds) {
      if (!pixelIds.includes(id)) {
        central.unregister(id);
      }
    }
    const registeredPixelsIds = new Set(central.registeredPixelsIds);
    for (const id of pixelIds) {
      if (!registeredPixelsIds.has(id)) {
        central.register(id);
        // Connect to initial list of dice with low priority,
        // dice added later will connect with high priority
        central.tryConnect(id, {
          priority: registeredPixelsIds.size ? "high" : "low",
        });
      }
    }
    // Keep pairedDice in dependencies!
  }, [central, pairedDice, store]);
  React.useEffect(() => {
    // Paired dice may have changed since the last render
    const newPairedDice = store.getState().pairedDice.paired;
    // Check if on-dice profile matches the expected hash
    for (const d of newPairedDice) {
      const { diceBrightnessFactor } = store.getState().appSettings;
      const { library } = store.getState();
      // Check profile
      const { profileUuid } = d;
      const profileData = library.profiles.entities[profileUuid];
      const profileHash = profileData?.hash;
      if (
        profileHash &&
        (profileHash !== d.profileHash ||
          !isSameBrightness(
            profileData.brightness * diceBrightnessFactor,
            d.brightness
          ))
      ) {
        const dataSet = createProfileDataSetWithOverrides(
          readProfile(profileUuid, library),
          diceBrightnessFactor
        );
        central.scheduleOperation(d.pixelId, {
          type: "programProfile",
          dataSet,
        });
      }
    }
  }, [
    central,
    store,
    // Keep to update profiles on app brightness change
    appBrightness,
    // Keep to update profiles on-dice change
    checkProfiles,
    pairedDice,
    // Keep to update profiles on profile data change
    profiles,
  ]);

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

  // Blink color
  React.useEffect(() => {
    central.setBlinkColor(
      new Color(ColorUtils.multiply(Color.dimGreen, appBrightness))
    );
  }, [central, appBrightness]);

  return (
    <PixelsCentralContext.Provider value={central}>
      <EditableProfileStoreGetterContext.Provider
        value={editableProfileStoreGetter}
      >
        {children}
      </EditableProfileStoreGetterContext.Provider>
    </PixelsCentralContext.Provider>
  );
}
