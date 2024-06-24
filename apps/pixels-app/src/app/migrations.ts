import { Mutable } from "@systemic-games/pixels-core-utils";
import {
  DiceUtils,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { PersistedState } from "redux-persist";

import { PairedDie } from "./PairedDie";
import { AppStore } from "./store";

import { pairDie } from "~/features/dice/pairDie";
import { computeProfileHashWithOverrides } from "~/features/profiles";
import { Library, readProfile } from "~/features/store";
import { AppProfileData } from "~/features/store/library/LibraryData";
import animationsRainbowReducer from "~/features/store/library/animations/rainbowSlice";

function updateFrom2To3(state: NonNullable<PersistedState>): void {
  const animId = "8c677768-975f-4544-b3ce-a219f68b9a79"; // Rainbow Waterfall Overlap
  if ("ids" in state && Array.isArray(state.ids)) {
    const animIndex = state.ids.indexOf(animId);
    if (animIndex >= 0) {
      console.warn(
        "Migrating from version 2 to 3: Removing Rainbow Waterfall Overlap"
      );
      const animState = state as unknown as ReturnType<
        typeof animationsRainbowReducer
      >;
      animState.ids.splice(animIndex, 1);
      delete animState.entities[animId];
    } else if (
      "entities" in state &&
      state.entities &&
      typeof state.entities === "object"
    ) {
      const values = Object.values(state.entities);
      if (values.length && "actions" in values[0]) {
        // Profiles
        for (const v of values) {
          const profile = v as Serializable.ProfileData;
          for (const playAnim of profile.actions.playAnimation) {
            if (playAnim.animationUuid === animId) {
              console.warn(
                `Migrating from version 2 to 3: Removing Rainbow Waterfall Overlap from profile ${profile.name} (${profile.uuid})`
              );
              playAnim.animationUuid = undefined;
            }
          }
          if (profile.brightness === undefined) {
            console.warn(
              `Migrating from version 2 to 3: Adding profile ${profile.name} brightness and colorway`
            );
            profile.brightness = 1;
            profile.colorway = "onyxBlack";
          }
        }
      }
    }
  } else if ("paired" in state && Array.isArray(state.paired)) {
    console.warn(
      "Migrating from version 2 to 3: Setting firmwareTimestamp to 0 for all paired dice"
    );
    const update = (dice: PairedDie[]) => {
      for (const readonlyDie of dice) {
        const die = readonlyDie as Mutable<PairedDie>;
        if (die.firmwareTimestamp === undefined) {
          die.firmwareTimestamp = 0;
        }
      }
    };
    update(state.paired);
    if ("unpaired" in state && Array.isArray(state.unpaired)) {
      update(state.unpaired);
    }
  }
}

function updateFrom3to4(state: NonNullable<PersistedState>): void {
  if (
    "profilesGrouping" in state &&
    typeof state.profilesGrouping === "string"
  ) {
    if (
      state.profilesGrouping === "lastUsed" ||
      state.profilesGrouping === "lastChanged"
    ) {
      console.warn(
        "Migrating from version 3 to 4: Changing profilesGrouping to lastModified"
      );
      state.profilesGrouping = "lastModified";
    }
  }
  if ("paired" in state && Array.isArray(state.paired)) {
    console.warn(
      "Migrating from version 3 to 4: Setting LED count and profileHash to 0 for all paired dice"
    );
    for (const readonlyDie of state.paired) {
      const die = readonlyDie as Mutable<PairedDie>;
      die.ledCount = DiceUtils.getLEDCount(die.dieType);
      // Leave "brightness" and "profileHash" undefined, it will be set when re-pairing die (see updatePairedDiceAndProfilesFrom3to4())
    }
    if ("unpaired" in state && Array.isArray(state.unpaired)) {
      state.unpaired.length = 0;
    }
  }
  if ("ids" in state && Array.isArray(state.ids)) {
    const cycleFireGradientId = "16b37bdc-741d-4766-9e33-51c3bf4c2e46";
    if (state.ids.includes(cycleFireGradientId)) {
      // Gradients
      console.warn(
        "Migrating from version 3 to 4: Deleting gradients (and therefore animations)"
      );
      state.ids.length = 0;
    } else if (
      "entities" in state &&
      state.entities &&
      typeof state.entities === "object"
    ) {
      const values = Object.values(state.entities);
      if (values.length && "lastChanged" in values[0]) {
        // Profiles
        for (const v of values) {
          const profile = v as AppProfileData;
          if ("lastChanged" in profile) {
            console.warn(
              `Migrating from version 3 to 4: Resetting hash and renaming lastChanged to lastModified for profile ${profile.name} (${profile.uuid})`
            );
            profile.lastModified = profile.lastChanged as number;
            // @ts-ignore
            profile.hash = undefined;
          }
        }
      }
    }
  }
}

const factoryProfilesUuids: string[] = [
  "8c7d22e1-78ea-4433-86d3-298311f4414a", // unknown
  "3a1997bd-5a10-4475-a7f5-57d8f1a7e6c5", // d20
  "d5b70abf-0f3d-450a-a43e-07781de25762", // d12
  "9f4f4365-4c41-42b6-9c66-25a603470702", // d10
  "c9562fb9-0fc1-43a6-81ed-fa6caec8f781", // d00
  "d2ce420e-1c38-47a5-b9ba-10d27b06a56c", // d8
  "9291dbb5-f864-4f94-bfb7-e035b8a914f4", // d6
  "0b02249f-0476-466f-8115-18addf754047", // d4
  "e167fd5b-30d5-45f7-a841-316d4acae5a1", // d6pipped
  "99f2b7d7-fbd1-47d9-b7a3-a4e90d806ff9", // d6fudge
] as const;

export function updatePairedDiceAndProfilesFrom3to4(store: AppStore): void {
  // Update profiles hash
  for (const profileData of Object.values(
    store.getState().library.profiles.entities
  )) {
    if (profileData && profileData.hash === undefined) {
      const profile = readProfile(profileData.uuid, store.getState().library);
      const hash = computeProfileHashWithOverrides(profile);
      console.warn(
        `Updating hash for profile ${profile.name} (${profile.uuid})`
      );
      store.dispatch(
        Library.Profiles.update({
          ...profileData,
          hash,
        })
      );
    }
  }
  // Update paired dice
  const { paired, unpaired } = store.getState().pairedDice;
  const diceToUpdate = paired.filter((d) => d.profileHash === undefined);
  if (diceToUpdate.length && unpaired.length) {
    // We should not have any unpaired dice when updating from 3 to 4
    console.warn(
      "Will be re-pairing some dice but there are unpaired dice too"
    );
  }
  // Create die profile by re-pairing dice
  for (const d of diceToUpdate) {
    console.warn(
      `Re-pairing die ${d.name} to generate profile (${d.profileUuid}) & hash`
    );
    // Profile won't be found if it's using the default profile
    const { library } = store.getState();
    const hasProfile = library.profiles.ids.includes(d.profileUuid);
    pairDie(
      {
        systemId: d.systemId,
        pixelId: d.pixelId,
        name: d.name,
        ledCount: d.ledCount,
        colorway: d.colorway,
        dieType: d.dieType,
        firmwareDate: new Date(d.firmwareTimestamp),
      },
      store,
      hasProfile && !factoryProfilesUuids.includes(d.profileUuid)
        ? readProfile(d.profileUuid, library)
        : undefined
    );
  }
}

export default {
  // v2.1
  2: (state: PersistedState) => {
    if (state?._persist?.version === 1) {
      console.warn("Migrating from version 1 to 2: Clearing state");
      return { _persist: state._persist };
    }
    return state;
  },
  // v2.2
  3: (state: PersistedState) => {
    const ver = state?._persist?.version;
    if (ver) {
      switch (ver) {
        case 1:
          console.warn("Migrating from version 1 to 3: Clearing state");
          return { _persist: state._persist };
        case 2:
          updateFrom2To3(state);
      }
    }
    return state;
  },
  // v2.3
  4: (state: PersistedState) => {
    const ver = state?._persist?.version;
    if (ver) {
      switch (ver) {
        case 1:
          console.warn("Migrating from version 1 to 3: Clearing state");
          return { _persist: state._persist };
        case 2:
          updateFrom2To3(state);
          updateFrom3to4(state);
          break;
        case 3:
          updateFrom3to4(state);
          break;
      }
    }
    return state;
  },
} as const;
