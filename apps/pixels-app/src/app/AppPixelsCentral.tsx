import {
  Color,
  ColorUtils,
  DataSet,
  getMPC,
  MPC,
  MPCMutableProps,
  Pixel,
  PixelMutableProps,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { reaction } from "mobx";
import React from "react";
import { Alert, AppState } from "react-native";

import { PairedDie } from "./PairedDie";
import { MPCRoles } from "./PairedMPC";
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
    const canPlayAudio =
      AppState.currentState === "active" || state.appSettings.backgroundAudio;
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
        if (canPlayAudio) playActionSpeakText(action);
      } else if (action instanceof Profiles.ActionPlayAudioClip) {
        if (canPlayAudio)
          playActionAudioClip(action, state.libraryAssets.audioClips.entities);
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

function syncMPCs(store: AppStore): void {
  console.log("Syncing MPCs");
  const referenceTime = 1000; // Arbitrary reference time
  const maxDelayTime = 100; // Expected max delay before we've messages all controllers
  const offset = 100;
  const targetTime = Date.now() + maxDelayTime;
  for (const pairedMPC of store.getState().pairedMPCs.paired) {
    const mpc = getMPC(pairedMPC.pixelId);
    if (mpc?.status === "ready") {
      mpc
        .sync(
          targetTime,
          referenceTime,
          (2.5 - Math.abs(MPCRoles.indexOf(pairedMPC.role) - 2.5)) * offset,
          0
        )
        .catch((e) => console.warn(`Error syncing MPC ${mpc.name}: ${e}`));
    }
  }
}

function hookToPixel(
  pixel: Pixel,
  store: AppStore,
  central: PixelsCentral
): () => void {
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
    if (pairedDie && pairedDie.firmwareTimestamp !== firmwareDate.getTime()) {
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
            pixelId,
            hash: profileHash,
          })
        );
      }
      // Update paired die brightness if profile was being programmed
      // and profile hashes are matching
      const op = central.getCurrentOperation(pixelId);
      const brightness =
        op?.type === "programProfile" && op.dataSet.brightness / 255;
      if (brightness !== false && pairedDie.brightness !== brightness) {
        const hash = DataSet.computeHash(op.dataSet.toByteArray());
        if (profileHash === hash) {
          store.dispatch(
            updatePairedDieBrightness({
              pixelId,
              brightness,
            })
          );
        }
      }
      // Always check if profile needs to be programmed
      programProfileIfNeeded(
        { ...pairedDie, profileHash }, // Use the up-to-date profile hash
        central,
        store.getState
      );
    }
  };
  pixel.addPropertyListener("profileHash", onProfileHash);
  const onProgProfileDisposer = central.addOperationStatusListener(
    pixel.pixelId,
    "programProfile",
    (ev) => {
      // Update brightness if profile was being programmed
      if (ev.status === "succeeded") {
        const pairedDie = pairedDiceSelectors.selectByPixelId(
          store.getState(),
          pixel.pixelId
        );
        const brightness = ev.operation.dataSet.brightness / 255;
        if (pairedDie && pairedDie.brightness !== brightness) {
          store.dispatch(
            updatePairedDieBrightness({
              pixelId: pixel.pixelId,
              brightness,
            })
          );
        }
      }
    }
  );

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

  return () => {
    pixel.removePropertyListener("name", onRename);
    pixel.removePropertyListener("firmwareDate", onFwDate);
    pixel.removePropertyListener("status", onStatus);
    pixel.removePropertyListener("profileHash", onProfileHash);
    pixel.removeEventListener("roll", onRoll);
    pixel.removeEventListener("remoteAction", onRemoteAction);
    onRenameDisposer();
    onProgProfileDisposer();
  };
}

function hookToMPC(
  mpc: MPC,
  store: AppStore,
  central: PixelsCentral
): () => void {
  // Die name
  const onRename = ({ pixelId, name }: MPCMutableProps) => {
    const pairedDie = pairedDiceSelectors.selectByPixelId(
      store.getState(),
      pixelId
    );
    if (pairedDie && pairedDie.name !== name) {
      store.dispatch(updatePairedDieName({ pixelId, name }));
    }
  };
  mpc.addPropertyListener("name", onRename);

  // Show dialog on rename error
  const onRenameDisposer = central.addOperationStatusListener(
    mpc.pixelId,
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
  const onFwDate = ({ pixelId, firmwareDate }: MPCMutableProps) => {
    const pairedDie = pairedDiceSelectors.selectByPixelId(
      store.getState(),
      pixelId
    );
    if (pairedDie && pairedDie.firmwareTimestamp !== firmwareDate.getTime()) {
      store.dispatch(
        updatePairedDieFirmwareTimestamp({
          pixelId,
          timestamp: firmwareDate.getTime(),
        })
      );
    }
  };
  mpc.addPropertyListener("firmwareDate", onFwDate);

  // Update name, firmware timestamp and profile hash on connection
  const onStatus = ({ status }: MPCMutableProps) => {
    if (status === "ready") {
      onRename(mpc);
      onFwDate(mpc);
      syncMPCs(store);
    }
  };
  mpc.addPropertyListener("status", onStatus);

  return () => {
    mpc.removePropertyListener("name", onRename);
    mpc.removePropertyListener("firmwareDate", onFwDate);
    mpc.removePropertyListener("status", onStatus);
    onRenameDisposer();
  };
}

export function AppPixelsCentral({ children }: React.PropsWithChildren) {
  const store = useAppStore();
  const [central] = React.useState(() => new PixelsCentral());

  // Setup event handlers
  React.useEffect(() => {
    const disposers = new Map<number, () => void>();

    // Hook to Pixel events
    const removeOnPixelFound = central.addListener(
      "onDeviceFound",
      ({ device }) => {
        // Clean up previous event listeners
        disposers.get(device.pixelId)?.();
        const unhook =
          device instanceof Pixel
            ? hookToPixel(device, store, central)
            : device instanceof MPC
              ? hookToMPC(device, store, central)
              : undefined;
        if (unhook) {
          disposers.set(device.pixelId, unhook);
        }
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
      "onRegisteredDeviceScanned",
      ({ status, notifier: { type, pixelId, firmwareDate } }) => {
        if (status === "scanned" && type === "die") {
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
      }
    );
  }, [central, store]);

  // Monitor paired dice
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const pairedMPCs = useAppSelector((state) => state.pairedMPCs.paired);
  React.useEffect(() => {
    const registeredIds = new Set(central.registeredPixelsIds);
    // Paired dice may have changed since the last render
    const upToDatePairedDice = store.getState().pairedDice.paired;
    const upToDatePairedMPCs = store.getState().pairedMPCs.paired;
    // Update list of registered Pixels
    const pixelIds = upToDatePairedDice
      .map((d) => d.pixelId)
      .concat(upToDatePairedMPCs.map((d) => d.pixelId));
    for (const id of registeredIds) {
      if (!pixelIds.includes(id)) {
        central.unregister(id);
      }
    }
    for (const id of pixelIds) {
      if (!registeredIds.has(id)) {
        central.register(id);
        // Connect to initial list of dice with low priority,
        // dice added later will connect with high priority
        central.tryConnect(id, {
          priority: registeredIds.size ? "high" : "low",
        });
      }
    }
    // Keep pairedDice in dependencies!
  }, [central, pairedDice, pairedMPCs, store]);

  // Check for dice in bootloader
  React.useEffect(() => {
    return central.addListener(
      "onPixelBootloaderScanned",
      ({ status, notifier }) => {
        if (status === "scanned") {
          const pairedDie = pairedDiceSelectors.selectByPixelId(
            store.getState(),
            notifier.pixelId
          );
          if (pairedDie?.firmwareTimestamp) {
            // Reset firmware timestamp as the die seems to be stuck in bootloader
            // (most likely because of an incomplete firmware)
            store.dispatch(
              updatePairedDieFirmwareTimestamp({
                pixelId: pairedDie.pixelId,
                timestamp: 0,
              })
            );
          }
        }
      }
    );
  }, [central, store]);

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

  // Re-sync MPCs every 10 minutes
  React.useEffect(() => {
    const id = setInterval(
      () => {
        syncMPCs(store);
      },
      10 * 60 * 1000
    );
    return () => clearInterval(id);
  }, [store]);

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
