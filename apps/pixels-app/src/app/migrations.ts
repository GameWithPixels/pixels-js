import { Mutable } from "@systemic-games/pixels-core-utils";
import {
  DiceUtils,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { PersistedState } from "redux-persist";

import { PairedDie } from "./PairedDie";
import { AppStore } from "./store";

import { pairDie } from "~/features/dice";
import { readProfile } from "~/features/store";
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
      // Leave "profileHash" undefined, it will be re-paired in AppInit
    }
    if ("unpaired" in state && Array.isArray(state.unpaired)) {
      state.unpaired.length = 0;
    }
  }
  if ("ids" in state && Array.isArray(state.ids)) {
    const cycleFireGradientId = "16b37bdc-741d-4766-9e33-51c3bf4c2e46";
    if (state.ids.includes(cycleFireGradientId)) {
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
          const profile = v as Serializable.ProfileData;
          if ("lastChanged" in profile) {
            console.warn(
              `Migrating from version 3 to 4: Renaming lastChanged to lastModified for profile ${profile.name} (${profile.uuid})`
            );
            profile.lastModified = profile.lastChanged as number;
          }
        }
      }
    }
  }
}

export function updatePairedDiceFrom3to4(store: AppStore): void {
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
    console.warn(`Re-pairing die ${d.name} to generate profile & hash`);
    // Profile won't be found if it's using the default profile
    const hasProfile = store
      .getState()
      .library.profiles.ids.includes(d.profileUuid);
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
      hasProfile
        ? readProfile(d.profileUuid, store.getState().library)
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
