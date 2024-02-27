import { Profiles } from "@systemic-games/react-native-pixels-connect";

const mainGradient: readonly string[] = [
  "3ac00114-1867-4b8f-97d5-86783521c48b",
  "79aa20f2-9e6c-4071-a063-3d66cd7e8075",
];
const angleGradient: readonly string[] = [
  "c89728f7-4ddf-4d05-818d-e57e200f9741",
  "d0e73d74-333e-4634-b30e-e078b376d789",
];
const noGradient: readonly string[] = [
  "ab516f76-fe89-48a6-8b11-35f997d31197",
  "ebfc1dd5-ec82-45ac-a653-db2fbb96e5c1",
  "e655e6e1-32c3-407b-a154-15ceef54c9f3",
  "b28682d0-fffd-4a07-b723-dbb127309c23",
  "17c75b18-b186-4a4e-ade0-bf94f658d6db",
  "61785d78-a642-461f-8dc1-1f0fb2dddd29",
  "5575de5a-2059-48c1-a08a-99ecc19b775c",
  "c30e296b-422a-4713-9bb4-85c2fcee56d8",
  "42613ce9-12fb-4973-8e38-cc0765d980f1",
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
    } else if (!noGradient.includes(anim.uuid)) {
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
