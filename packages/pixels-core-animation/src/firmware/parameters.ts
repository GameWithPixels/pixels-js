import { enumValue, serializable } from "@systemic-games/pixels-core-utils";

import { Pointer } from "./profileBuffer";

/**
 * Scalar types.
 * @category Animation
 */
export const ScalarTypeValues = {
  unknown: enumValue(0),
  u8: enumValue(), // 8-bit value
  u16: enumValue(), // 16-bit value
  global: enumValue(),
  lookup: enumValue(),
  // After this are Curve types
  curveTwoUInt8: enumValue(0xf), // simple interpolation between two 8 bit values
  curveTwoUInt16: enumValue(), // simple interpolation between two 16 bit values
  curveTrapezeUInt8: enumValue(), // trapeze shaped interpolation from 0 to a given value and back to 0
  curveTrapezeUInt16: enumValue(), // trapeze shaped interpolation from 0 to a given value and back to 0
  curveU16Keyframes: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ScalarTypeValues}.
 * @category Animation
 */
export type ScalarType = keyof typeof ScalarTypeValues;

/**
 * Color types.
 * @category Animation
 */
export const ColorTypeValues = {
  unknown: enumValue(0),
  palette: enumValue(), // uses the global palette
  rgb: enumValue(), // stores actual rgb values
  lookup: enumValue(), // uses a scalar to lookup the color in a gradient
  // After this are gradient types
  gradientRainbow: enumValue(0xf), // basic programmatic rainbow gradient
  gradientTwoColors: enumValue(), // simple two-color gradient
  gradientKeyframes: enumValue(), // gradient with a few keyframes
} as const;

/**
 * The names for the "enum" type {@link ColorTypeValues}.
 * @category Animation
 */
export type ColorType = keyof typeof ColorTypeValues;

/**
 * Global types.
 * @category Animation
 */
export const GlobalTypeValues = {
  unknown: enumValue(0),
  normalizedCurrentFace: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link GlobalTypeValues}.
 * @category Animation
 */
export type GlobalType = keyof typeof GlobalTypeValues;

/**
 * Easing types.
 * @category Animation
 */
export const EasingTypeValues = {
  unknown: enumValue(0),
  step: enumValue(),
  linear: enumValue(),
  easeIn: enumValue(),
  easeOut: enumValue(),
  easeInEaseOut: enumValue(), // S curve
  // Etc...
} as const;

/**
 * The names for the "enum" type {@link EasingTypeValues}.
 * @category Animation
 */
export type EasingType = keyof typeof EasingTypeValues;

export class DScalar {
  @serializable(1)
  type = ScalarTypeValues.unknown;
}

export class DScalarUInt8 extends DScalar {
  @serializable(1)
  value = 0;
}

export class DScalarUInt16 extends DScalar {
  @serializable(2)
  value = 0;
}

export class DScalarUInt32 extends DScalar {
  @serializable(4)
  value = 0;
}

export class DScalarGlobal extends DScalar {
  globalType = GlobalTypeValues.unknown;
}

export class DScalarLookup extends DScalar {
  lookupCurve = new Pointer<DCurve>();
  parameter = new Pointer<DScalar>();
}

export class DCurve extends DScalar {
  // Base class for curves doesn't have any additional data
  // because we re-use the type identifier from DScalar
}

export class DCurveTwoUInt8 extends DCurve {
  @serializable(1)
  start = 0;
  @serializable(1)
  end = 0;
  @serializable(1)
  easing = EasingTypeValues.unknown;
}

export class DCurveTwoUInt16 extends DCurve {
  @serializable(2)
  start = 0;
  @serializable(2)
  end = 0;
  @serializable(1)
  easing = EasingTypeValues.unknown;
}

export class DCurveTrapezeUInt8 extends DCurve {
  @serializable(1)
  value = 0;
  @serializable(1)
  rampUpScale = 0;
  @serializable(1)
  rampDownScale = 0;
  @serializable(1)
  rampUpEasing = EasingTypeValues.unknown;
  @serializable(1)
  rampDownEasing = EasingTypeValues.unknown;
}

export class DCurveTrapezeUInt16 extends DCurve {
  @serializable(2)
  value = 0;
  @serializable(1)
  rampUpScale = 0;
  @serializable(1)
  rampDownScale = 0;
  @serializable(1)
  rampUpEasing = EasingTypeValues.unknown;
  @serializable(1)
  rampDownEasing = EasingTypeValues.unknown;
}

export class KeyframeUInt16 {
  @serializable(2)
  time = 0;
  @serializable(2)
  value = 0;
}

export class DCurveUInt16Keyframes extends DCurve {
  keyframes: KeyframeUInt16[] = [];
}

export class DColor {
  @serializable(1)
  type = ColorTypeValues.unknown;
}

export class DColorPalette extends DColor {
  @serializable(1)
  index = 0;
}
// size: 2 bytes

export class DColorRGB extends DColor {
  @serializable(1)
  rValue = 0;
  @serializable(1)
  gValue = 0;
  @serializable(1)
  bValue = 0;
}
// size: 4 bytes

export class DColorLookup extends DColor {
  lookupGradient = new Pointer<DGradient>();
  parameter = new Pointer<DScalar>();
}

// Etc...
export class DGradient extends DColor {
  // Base class for gradients doesn't have any additional data
  // because we re-use the type identifier from DGradient
}

export class DGradientRainbow extends DGradient {
  // No data for now
}
// size: 1 bytes

export class DGradientTwoColors extends DGradient {
  start = new Pointer<DColor>(); // 2 bytes
  end = new Pointer<DColor>(); // 2 bytes
  @serializable(1)
  easing = EasingTypeValues.unknown;
}
// size: 6 bytes

export class KeyframeUInt16Easing {
  @serializable(2)
  time = 0;
  @serializable(1)
  index = 0; // palette index
  @serializable(1)
  easing = EasingTypeValues.unknown;
}

export class DGradientKeyframes extends DGradient {
  keyframes: KeyframeUInt16Easing[] = [];
}

export class DScalarPtr extends Pointer<DScalar> {}
export class DCurvePtr extends Pointer<DCurve> {}
export class DColorPtr extends Pointer<DColor> {}
export class DGradientPtr extends Pointer<DGradient> {}
