import {
  DiceUtils,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import {
  getAnimationGradient,
  setAnimationGradient,
} from "~/features/store/library/animationGradient";

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
        DiceUtils.mapFaceForAnimation(f, profile.dieType)
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

export function applyActionOverrides(
  action: Readonly<Profiles.ActionPlayAnimation>
): Profiles.Animation | undefined {
  const originalAnim = action.animation;
  if (originalAnim) {
    let anim = originalAnim;
    const getAnim = () =>
      anim === originalAnim ? (anim = originalAnim.duplicate()) : anim;
    if (action.duration !== undefined) {
      getAnim().duration = action.duration;
    }
    if (action.fade !== undefined) {
      const anim = getAnim();
      if ("fade" in anim && typeof anim.fade === "number") {
        (anim.fade as number) = action.fade;
      }
    }
    if (action.intensity !== undefined) {
      const anim = getAnim();
      if ("intensity" in anim && typeof anim.intensity === "number") {
        (anim.intensity as number) = action.intensity;
      }
    }
    if (action.colors.length) {
      const anim = getAnim();
      if ("color" in anim && anim.color instanceof Profiles.FaceColor) {
        (anim.color as Profiles.FaceColor) = new Profiles.FaceColor(
          action.colors[0].duplicate()
        );
      } else {
        const gradient = getAnimationGradient(anim);
        if (gradient && gradient.keyframes.length === action.colors.length) {
          setAnimationGradient(
            anim,
            new Profiles.RgbGradient({
              keyframes: action.colors.map((c, i) => {
                const kf = gradient.keyframes[i].duplicate();
                kf.color = c.duplicate();
                return kf;
              }),
            })
          );
        }
      }
    }
    return anim;
  }
}
