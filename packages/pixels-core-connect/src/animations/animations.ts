import {
  enumFlag,
  enumValue,
  serializable,
} from "@systemic-games/pixels-core-utils";

import { DColorPtr } from "./parameters";

export const AnimationTypeValues = {
  AnimationType_Unknown: enumValue(0),
  AnimationType_Simple: enumValue(),
  AnimationType_Rainbow: enumValue(),
  AnimationType_BlinkID: enumValue(),
  AnimationType_Pattern: enumValue(),
  AnimationType_Sequence: enumValue(),
  // etc...
} as const;

// Flags for the animations, they can be combined.
export const AnimationFlags = {
  AnimationFlags_None: 0,
  AnimationFlags_Traveling: enumFlag(0),
  AnimationFlags_UseLedIndices: enumFlag(),
  AnimationFlags_HighestLED: enumFlag(),
} as const;

// Base struct for animation presets. All presets have a few properties in common.
// Presets are stored in flash, so do not have methods or vtables or anything like that.
export class Animation {
  @serializable(1)
  type = AnimationTypeValues.AnimationType_Unknown;
  @serializable(1)
  animFlags = 0; // Combination of AnimationFlags
  @serializable(2)
  duration = 0; // in ms
}

export const AnimationSimpleFlags = {
  AnimationSimpleFlags_None: 0,
  AnimationSimpleFlags_CaptureColor: enumFlag(0),
} as const;

/// Procedural on off animation
export class AnimationSimple extends Animation {
  @serializable(1)
  colorFlag = 0;
  @serializable(4)
  faceMask = 0;
  color = new DColorPtr();
  @serializable(1)
  count = 0;
  @serializable(1)
  fade = 0;
}
