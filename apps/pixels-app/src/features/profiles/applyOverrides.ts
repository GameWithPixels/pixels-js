import {
  DiceUtils,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { AnimationUtils } from "~/features/store/library/AnimationUtils";

// Returns a new profile with overrides applied
export function applyProfileOverrides(
  profile: Readonly<Profiles.Profile>
): Profiles.Profile {
  const modified = profile.duplicate();
  modified.rules = modified.rules.filter(
    (r) => r.condition.type !== "handling"
  );
  for (const rule of modified.rules) {
    if (rule.condition instanceof Profiles.ConditionRolled) {
      rule.condition.faces = rule.condition.faces.map((f) =>
        DiceUtils.mapFaceForAnimation(f, modified.dieType)
      );
    }
    for (const action of rule.actions) {
      if (action instanceof Profiles.ActionPlayAnimation) {
        action.animation = applyActionOverrides(action);
      }
    }
  }
  return modified;
}

// Returns a new animation with overrides applied
export function applyActionOverrides(
  action: Readonly<Profiles.ActionPlayAnimation>
): Profiles.Animation | undefined {
  const originalAnim = action.animation;
  if (originalAnim) {
    let anim = originalAnim;
    const animUuid = originalAnim.uuid;
    const getEditableAnim = () =>
      anim === originalAnim ? (anim = originalAnim.duplicate()) : anim;
    if (action.duration !== undefined) {
      getEditableAnim().duration = action.duration;
    }
    if (action.fade !== undefined && AnimationUtils.hasEditableFading(anim)) {
      AnimationUtils.setEditableFading(getEditableAnim(), action.fade);
    }
    if (
      action.intensity !== undefined &&
      AnimationUtils.hasEditableIntensity(anim)
    ) {
      AnimationUtils.setEditableIntensity(getEditableAnim(), action.intensity);
    }
    if (action.colors.length) {
      if (AnimationUtils.hasEditableColor(anim, animUuid)) {
        AnimationUtils.setEditableColor(
          getEditableAnim(),
          new Profiles.FaceColor(action.colors[0].duplicate()),
          animUuid
        );
      } else {
        const gradient = AnimationUtils.getEditableGradient(anim);
        if (gradient && gradient.keyframes.length === action.colors.length) {
          AnimationUtils.setEditableGradient(
            getEditableAnim(),
            new Profiles.RgbGradient({
              keyframes: action.colors.map((c, i) => {
                const kf = gradient.keyframes[i].duplicate();
                kf.color = c.duplicate();
                return kf;
              }),
            }),
            animUuid
          );
        }
      }
    }
    return anim;
  }
}
