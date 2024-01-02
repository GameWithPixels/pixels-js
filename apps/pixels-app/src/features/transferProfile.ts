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
import Toast from "react-native-root-toast";

import { blinkDie } from "./blinkDie";
import {
  clearProfileTransfer,
  setProfileTransfer,
} from "./store/diceRollsSlice";
import { setPairedDieProfile } from "./store/pairedDiceSlice";
import { setProfileHash } from "./store/profilesLibrarySlice";

import { store } from "~/app/store";
import { AppDarkTheme } from "~/themes";

export function transferProfile(
  pixel: Pixel,
  profile: Readonly<Profiles.Profile>
): void {
  console.log(
    `Transferring profile ${profile.name} to die ${pixel.pixelId
      .toString(16)
      .padStart(8)}`
  );

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
    console.log("  - Rule of type " + rule.condition.type);
    for (const action of rule.actions) {
      if (action.type === "playAnimation") {
        const act = action as Profiles.ActionPlayAnimation;
        if (act.animation && act.duration !== undefined) {
          const anim = act.animation.duplicate();
          anim.duration = act.duration;
          act.animation = anim;
        }
        const anim = act.animation;
        console.log(
          anim
            ? `      Play anim named ${anim.duration} of type ${anim.type}`
            : "      No animation!"
        );
      }
    }
  }

  const ds = createDataSetForProfile(modified);
  // TODO update hash for factory profiles that were imported without one
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
    .then(() => {
      blinkDie(pixel);
      Toast.show(`\nProfile "${profile.name}" activated on ${pixel.name}\n`, {
        duration: Toast.durations.SHORT,
        position: -100,
        opacity: 1.0,
        backgroundColor: AppDarkTheme.colors.elevation.level3,
        textColor: AppDarkTheme.colors.onSurface,
      });
    })
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
