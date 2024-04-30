import {
  enumFlag,
  enumValue,
  serializable,
} from "@systemic-games/pixels-core-utils";

import { ANIM_FACEMASK_ALL_LEDS } from "./constants";
import { DColor } from "./parameters";

export const AnimationTypeValues = {
  unknown: enumValue(0),
  simple: enumValue(),
  rainbow: enumValue(),
  blinkID: enumValue(),
  pattern: enumValue(),
  sequence: enumValue(),
  // etc...
} as const;

/**
 * The names for the "enum" type {@link AnimationTypeValues}.
 * @category Animation
 */
export type AnimationType = keyof typeof AnimationTypeValues;

// Flags for the animations, they can be combined.
export const AnimationFlagsValues = {
  traveling: enumFlag(0),
  useLedIndices: enumFlag(),
  highestLed: enumFlag(),
} as const;

/**
 * The names for the "enum" type {@link AnimationFlagsValues}.
 * @category Animation
 */
export type AnimationFlags = keyof typeof AnimationFlagsValues;

// Base struct for animation presets. All presets have a few properties in common.
// Presets are stored in flash, so do not have methods or vtables or anything like that.
export interface Animation {
  /** See {@link AnimationTypeValues} for possible values. */
  type: number;

  /** See {@link AnimationFlagsValues} for possible values. */
  animFlags: number;

  /** Animation duration in milliseconds. */
  duration: number;

  intensity: number;
}

export const AnimationSimpleFlagsValues = {
  captureColor: enumFlag(0),
} as const;

/**
 * The names for the "enum" type {@link AnimationSimpleFlagsValues}.
 * @category Animation
 */
export type AnimationSimpleFlags = keyof typeof AnimationSimpleFlagsValues;

// Procedural on off animation
export class AnimationSimple implements Animation {
  @serializable(1)
  type = AnimationTypeValues.simple;

  @serializable(1)
  animFlags = 0; // Combination of AnimationFlags

  @serializable(2)
  duration = 0; // in ms

  @serializable(4)
  faceMask = ANIM_FACEMASK_ALL_LEDS;

  @serializable(1)
  intensity = 128;

  @serializable(1)
  colorFlags = 0;

  color?: DColor;
  @serializable(2)
  colorIndex = 0;

  @serializable(1)
  count = 1;

  @serializable(1)
  fade = 128;
}

// Procedural rainbow animation data
export class AnimationRainbow implements Animation {
  @serializable(1)
  type = AnimationTypeValues.rainbow;

  @serializable(1)
  animFlags = 0; // Combination of AnimationFlags

  @serializable(2)
  duration = 0; // in ms

  @serializable(4)
  faceMask = ANIM_FACEMASK_ALL_LEDS;

  @serializable(1)
  intensity = 128;

  @serializable(1)
  count = 1;

  @serializable(1)
  fade = 128;

  @serializable(1)
  cyclesTimes10 = 0;
}
