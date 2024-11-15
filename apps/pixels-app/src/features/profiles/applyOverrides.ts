import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { AnimationUtils } from "~/features/store/library";

// Returns a new profile with overrides applied
export function applyProfileOverrides(
  profile: Readonly<Profiles.Profile>
): Profiles.Profile {
  const modified = profile.duplicate();
  modified.rules = modified.rules.filter(
    (r) => r.condition.type !== "handling"
  );
  for (const rule of modified.rules) {
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
    const animUuid = originalAnim.uuid;
    let anim = originalAnim;
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
    if (
      action.faceMask !== undefined &&
      AnimationUtils.hasEditableFaceMask(anim)
    ) {
      AnimationUtils.setEditableFaceMask(getEditableAnim(), action.faceMask);
    }
    if (action.colors.length) {
      if (AnimationUtils.hasEditableColor(anim, animUuid)) {
        AnimationUtils.setEditableColor(
          getEditableAnim(),
          new Profiles.FaceColor(action.colors[0].duplicate()),
          animUuid
        );
      } else {
        const gradient = AnimationUtils.getEditableGradient(anim, animUuid);
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
