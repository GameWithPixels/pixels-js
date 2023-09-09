import {
  AnimationFlagsValues,
  EditAnimationRainbow,
  getFaceMask,
} from "@systemic-games/pixels-edit-animation";

export const PrebuildAnimations = {
  rainbow: new EditAnimationRainbow({
    duration: 10,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 4,
    fade: 0.5,
    cycles: 1,
  }),
  rainbowAllFaces: new EditAnimationRainbow({
    duration: 10,
    count: 3,
    fade: 0.5,
  }),
  fixedRainbow: new EditAnimationRainbow({
    duration: 10,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 0,
    fade: 0.05,
    cycles: 3.67,
  }),
  fixedRainbowD4: new EditAnimationRainbow({
    duration: 10,
    faces: getFaceMask([1, 4, 5, 6], "d6"),
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 0,
    fade: 0.05,
    cycles: 3.67,
  }),
} as const;
