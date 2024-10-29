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

import { PairedDie } from "./PairedDie";
import { useAppSelector, useAppStore } from "./hooks";
import {
  AppStore,
  pairedDiceSelectors,
  RootState,
  startAppListening,
} from "./store";

import { PixelsCentral } from "~/features/dice";
import {
  createProfileDataSetWithOverrides,
  getWebRequestPayload,
  playActionAudioClip,
  playActionMakeWebRequest,
  playActionSpeakText,
} from "~/features/profiles";
import {
  addDieRoll,
  addRollerEntry,
  Library,
  readProfile,
  updatePairedDieBrightness,
  updatePairedDieFirmwareTimestamp,
  updatePairedDieName,
  updatePairedDieProfileHash,
} from "~/features/store";
import { AppProfileData } from "~/features/store/library";
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
      } else if (action instanceof Profiles.ActionPlayAudioClip) {
        const clipName =
          action.clipUuid &&
          state.libraryAssets.audioClips.entities[action.clipUuid]?.name;
        playActionAudioClip(action, clipName);
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

function programProfileIfNeeded(
  pairedDie: PairedDie,
  central: PixelsCentral,
  getState: () => RootState
): void {
  const {
    library,
    appSettings: { diceBrightnessFactor },
  } = getState();
  const profileData = library.profiles.entities[pairedDie.profileUuid];
  if (
    profileData &&
    (pairedDie.profileHash !== profileData.hash ||
      !isSameBrightness(
        pairedDie.brightness,
        profileData.brightness * diceBrightnessFactor
      ))
  ) {
    const dataSet = createProfileDataSetWithOverrides(
      readProfile(pairedDie.profileUuid, library),
      diceBrightnessFactor
    );
    central.scheduleOperation(pairedDie.pixelId, {
      type: "programProfile",
      dataSet,
    });
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
        const onRename = ({ pixelId, name }: PixelMutableProps) => {
          const pairedDie = pairedDiceSelectors.selectByPixelId(
            store.getState(),
            pixelId
          );
          if (pairedDie && pairedDie.name !== name) {
            store.dispatch(updatePairedDieName({ pixelId, name }));
          }
        };
        pixel.addPropertyListener("name", onRename);

        // Show dialog on rename error
        const onRenameDisposer = central.addOperationStatusListener(
          pixel.pixelId,
          "rename",
          (ev) => {
            if (ev.status === "failed") {
              // Show dialog on rename error
              Alert.alert(
                "Failed to Rename Die",
                "An error occurred while renaming the die\n" + String(ev.error),
                [{ text: "OK", style: "default" }]
              );
            }
          }
        );

        // Firmware date
        const onFwDate = ({ pixelId, firmwareDate }: PixelMutableProps) => {
          const pairedDie = pairedDiceSelectors.selectByPixelId(
            store.getState(),
            pixelId
          );
          if (
            pairedDie &&
            pairedDie.firmwareTimestamp !== firmwareDate.getTime()
          ) {
            store.dispatch(
              updatePairedDieFirmwareTimestamp({
                pixelId,
                timestamp: firmwareDate.getTime(),
              })
            );
          }
        };
        pixel.addPropertyListener("firmwareDate", onFwDate);

        // Profile
        const onProfileHash = ({ pixelId, profileHash }: PixelMutableProps) => {
          const pairedDie = pairedDiceSelectors.selectByPixelId(
            store.getState(),
            pixelId
          );
          if (pairedDie) {
            if (pairedDie.profileHash !== profileHash) {
              store.dispatch(
                updatePairedDieProfileHash({
                  pixelId: pixel.pixelId,
                  hash: profileHash,
                })
              );
            }
            // Update paired die brightness if profile is being programmed
            const op = central.getCurrentOperation(pixelId);
            if (op?.type === "programProfile") {
              // Note: if the die has restarted during programming, and reconnected
              //       before the operation has failed, the brightness will still be updated
              // Update paired die brightness
              store.dispatch(
                updatePairedDieBrightness({
                  pixelId: pixel.pixelId,
                  brightness: op.dataSet.brightness / 255,
                })
              );
            }
            // Always check if profile needs to be programmed
            programProfileIfNeeded(pairedDie, central, store.getState);
          }
        };
        pixel.addPropertyListener("profileHash", onProfileHash);

        // Update name, firmware timestamp and profile hash on connection
        const onStatus = ({ status }: PixelMutableProps) => {
          if (status === "ready") {
            onRename(pixel);
            onFwDate(pixel);
            onProfileHash(pixel);
          }
        };
        pixel.addPropertyListener("status", onStatus);

        // Rolls
        const onRoll = (roll: number) => {
          const pairedDie = pairedDiceSelectors.selectByPixelId(
            store.getState(),
            pixel.pixelId
          );
          if (pairedDie) {
            store.dispatch(addDieRoll({ pixelId: pixel.pixelId, roll }));
            store.dispatch(
              addRollerEntry({
                pixelId: pixel.pixelId,
                dieType: pixel.dieType,
                value: roll,
              })
            );
          }
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
          onRenameDisposer();
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
        const pairedDie = pairedDiceSelectors.selectByPixelId(
          store.getState(),
          pixelId
        );
        if (
          pairedDie &&
          pairedDie.firmwareTimestamp !== firmwareDate.getTime()
        ) {
          store.dispatch(
            updatePairedDieFirmwareTimestamp({
              pixelId,
              timestamp: firmwareDate.getTime(),
            })
          );
        }
      }
    );
  }, [central, store]);

  // Monitor paired dice
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
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

  // Re-program profiles when app brightness changes
  const appBrightness = useAppSelector(
    (state) => state.appSettings.diceBrightnessFactor
  );
  React.useEffect(() => {
    for (const d of store.getState().pairedDice.paired) {
      programProfileIfNeeded(d, central, store.getState);
    }
  }, [central, store, appBrightness]);

  // Watch profiles changes
  React.useEffect(() => {
    // Using the proper 'addAppListener' displays a Redux 'non serializable' error check
    // const unsubscribe = store.dispatch(addAppListener({
    return startAppListening({
      predicate: (action) => {
        return Library.Profiles.update.match(action);
      },
      effect: (action, listenerApi) => {
        const { uuid } = action.payload as AppProfileData;
        const pairedDie = pairedDiceSelectors.selectByProfileUuid(
          listenerApi.getState(),
          uuid
        );
        pairedDie &&
          programProfileIfNeeded(pairedDie, central, listenerApi.getState);
      },
    });
    // return () => unsubscribe.payload.unsubscribe(); // For some reason unsubscribe is undefined
  }, [central, store]);

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
          // Create a new editable profile
          const profileStore = new EditableProfileStore(profileUuid, () =>
            readProfile(profileUuid, store.getState().library, true)
          );
          editableProfileStoresMap.set(profileUuid, profileStore);
          // Auto save dice profiles and update paired die profile hash
          const disposer = reaction(
            () => profileStore.version,
            (version) => {
              if (version > 0) {
                // Find die programmed with this profile
                const pairedDie = pairedDiceSelectors.selectByProfileUuid(
                  store.getState(),
                  profileUuid
                );
                if (pairedDie) {
                  // Save die profile
                  const profile = profileStore.profile;
                  if (profile) {
                    commitEditableProfile(profile, store);
                  } else {
                    logError("No die editable profile to save");
                  }
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
