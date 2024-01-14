import { Profiles } from "@systemic-games/react-native-pixels-connect";

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

export function applyActionOverrides(
  act: Readonly<Profiles.ActionPlayAnimation>
): Profiles.Animation | undefined {
  const originalAnim = act.animation;
  if (originalAnim) {
    let anim = originalAnim;
    const getAnim = () => {
      if (anim === originalAnim) {
        anim = originalAnim.duplicate();
      }
      return anim!;
    };
    if (act.duration !== undefined) {
      getAnim().duration = act.duration;
    }
    if (act.fade !== undefined) {
      const anim = getAnim();
      if ("fade" in anim) {
        anim.fade = act.fade;
      }
    }
    if (act.intensity !== undefined) {
      const anim = getAnim();
      if ("intensity" in anim) {
        anim.intensity = act.intensity;
      }
    }
    if (act.colors.length) {
      const anim = getAnim();
      if ("color" in anim) {
        anim.color = act.colors[0].duplicate();
      } else if ("gradient" in anim) {
        const gradient = anim.gradient as Profiles.RgbGradient;
        if (gradient.keyframes.length === act.colors.length) {
          anim.gradient = new Profiles.RgbGradient({
            keyframes: act.colors.map((c, i) => {
              const kf = gradient.keyframes[i].duplicate();
              kf.color = c.duplicate();
              return kf;
            }),
          });
        }
      }
    }
    return anim;
  }
}
