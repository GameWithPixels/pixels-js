import {
  AnimationFlagsValues,
  EditAnimationRainbow,
} from "@systemic-games/pixels-edit-animation";

export const PrebuildAnimations = {
  rainbow: new EditAnimationRainbow({
    duration: 10,
    animFlags: AnimationFlagsValues.traveling,
    count: 4,
    fade: 0.5,
  }),
  rainbowAllFaces: new EditAnimationRainbow({
    duration: 10,
    count: 3,
    fade: 0.5,
  }),
} as const;
