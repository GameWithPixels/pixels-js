import { range } from "@systemic-games/pixels-core-utils";
import {
  createDataSetForProfile,
  DataSet,
} from "@systemic-games/pixels-edit-animation";
import {
  DiceUtils,
  Pixel,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";

import {
  clearProfileTransfer,
  setProfileTransfer,
} from "./store/diceRollsSlice";
import { setPairedDieProfile } from "./store/pairedDiceSlice";
import { setProfileHash } from "./store/profilesLibrarySlice";

import { store } from "~/app/store";

export function transferProfile(
  pixel: Pixel,
  profile: Readonly<Profiles.Profile>
): void {
  // Modify a copy of the profile to:
  // - remove handling rules
  // - set the actual faces of the "all" faces rolled condition
  // - apply animation override
  const modified = profile.duplicate();
  modified.rules = modified.rules.filter(
    (r) => r.condition.type !== "handling"
  );
  for (const rule of modified.rules) {
    if (rule.condition.type === "rolled") {
      const cond = rule.condition as Profiles.ConditionRolled;
      if (cond.faces === "all") {
        const at = rule.actions[0]?.type;
        if (at) {
          const other = modified.rules
            .filter(
              (r) => r.condition.type === "rolled" && r.actions[0]?.type === at
            )
            .flatMap((r) => {
              const faces = (r.condition as Profiles.ConditionRolled).faces;
              return faces === "all" ? [] : faces;
            });
          cond.faces = range(
            1,
            1 + DiceUtils.getFaceCount(pixel.dieType)
          ).filter((f) => !other.includes(f));
        }
      }
    }
    for (const action of rule.actions) {
      if (action.type === "playAnimation") {
        const act = action as Profiles.ActionPlayAnimation;
        if (act.animation && act.duration !== undefined) {
          const anim = act.animation.duplicate();
          anim.duration = act.duration;
          act.animation = anim;
        }
      }
    }
  }

  const ds = createDataSetForProfile(modified);
  console.log(
    `Transferring profile ${profile.name} to die ${pixel.pixelId
      .toString(16)
      .padStart(8)}`
  );
  // TODO update hash for default profiles that were imported without one
  const serializedProfile = store
    .getState()
    .profilesLibrary.profiles.find((p) => p.uuid === profile.uuid);
  if (serializedProfile && !serializedProfile.hash) {
    const hash = DataSet.computeHash(ds.toDataSet().toByteArray());
    store.dispatch(setProfileHash({ uuid: profile.uuid, hash }));
  }
  // TODO update when getting confirmation from the die in usePairedPixels
  store.dispatch(
    setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );
  store.dispatch(
    setProfileTransfer({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );
  const data = ds.toDataSet();
  pixel
    .transferDataSet(data)
    .catch((e) => {
      console.log(`Error while transferring profile: ${e}`);
      Alert.alert(
        "Failed to Activate Profile",
        "An error occurred while transferring the profile data to the die. The error is " +
          String(e),
        [{ text: "OK" }]
      );
    })
    .finally(() => store.dispatch(clearProfileTransfer()));
}
