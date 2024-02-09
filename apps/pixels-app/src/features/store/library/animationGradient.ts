import { Profiles } from "@systemic-games/react-native-pixels-connect";

const mainGradient: readonly string[] = [
  "3ac00114-1867-4b8f-97d5-86783521c48b",
  "79aa20f2-9e6c-4071-a063-3d66cd7e8075",
];
const angleGradient: readonly string[] = [
  "c89728f7-4ddf-4d05-818d-e57e200f9741",
  "d0e73d74-333e-4634-b30e-e078b376d789",
];

export function getAnimationGradient(
  anim?: Profiles.Animation
): Profiles.RgbGradient | undefined {
  if (anim instanceof Profiles.AnimationGradient) {
    return anim.gradient;
  } else if (anim instanceof Profiles.AnimationGradientPattern) {
    return anim.gradient;
  } else if (anim instanceof Profiles.AnimationNormals) {
    if (mainGradient.includes(anim.uuid)) {
      return anim.gradient;
    } else if (angleGradient.includes(anim.uuid)) {
      return anim.angleGradient;
    } else {
      return anim.axisGradient;
    }
  } else if (anim instanceof Profiles.AnimationCycle) {
    return anim.gradient;
  } else if (anim instanceof Profiles.AnimationNoise) {
    return anim.gradient;
  }
}

export function setAnimationGradient(
  anim?: Profiles.Animation,
  gradient?: Profiles.RgbGradient
): void {
  if (anim instanceof Profiles.AnimationGradient) {
    anim.gradient = gradient;
  } else if (anim instanceof Profiles.AnimationGradientPattern) {
    anim.gradient = gradient;
  } else if (anim instanceof Profiles.AnimationNormals) {
    if (mainGradient.includes(anim.uuid)) {
      anim.gradient = gradient;
    } else if (angleGradient.includes(anim.uuid)) {
      anim.angleGradient = gradient;
    } else {
      anim.axisGradient = gradient;
    }
  } else if (anim instanceof Profiles.AnimationNoise) {
    anim.gradient = gradient;
  } else if (anim instanceof Profiles.AnimationCycle) {
    anim.gradient = gradient;
  }
}
