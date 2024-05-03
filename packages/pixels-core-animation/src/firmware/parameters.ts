import { enumValue, serializable } from "@systemic-games/pixels-core-utils";

/**
 * Scalar types.
 * @category Animation
 */
export const ScalarTypeValues = {
  u8: enumValue(0), // 8-bit value
  u16: enumValue(), // 16-bit value
  global: enumValue(),
  lookup: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ScalarTypeValues}.
 * @category Animation
 */
export type ScalarType = keyof typeof ScalarTypeValues;

export interface DScalar {
  /** See {@link ScalarTypeValues} for possible values. */
  type: number;
}

export class DScalarUInt8 implements DScalar {
  @serializable(1)
  type = ScalarTypeValues.u8;

  @serializable(1)
  value = 0;
}

export class DScalarUInt16 implements DScalar {
  @serializable(1)
  type = ScalarTypeValues.u16;

  @serializable(2)
  value = 0;
}

/**
 * Global types.
 * @category Animation
 */
export const GlobalTypeValues = {
  normalizedCurrentFace: enumValue(0),
} as const;

/**
 * The names for the "enum" type {@link GlobalTypeValues}.
 * @category Animation
 */
export type GlobalType = keyof typeof GlobalTypeValues;

export class DScalarGlobal implements DScalar {
  @serializable(1)
  type = ScalarTypeValues.global;

  @serializable(1)
  globalType = GlobalTypeValues.normalizedCurrentFace;
}

export class DScalarLookup implements DScalar {
  @serializable(1)
  type = ScalarTypeValues.lookup;

  lookupCurve?: DCurve;
  @serializable(2)
  lookupCurveIndex = 0;

  parameter?: DScalar;
  @serializable(2)
  parameterIndex = 0;
}

/**
 * Curve types.
 * @category Animation
 */
export const CurveTypeValues = {
  twoU8: enumValue(0), // simple interpolation between two 8 bit values
  twoU16: enumValue(), // simple interpolation between two 16 bit values
  trapezeU8: enumValue(), // trapeze shaped interpolation from 0 to a given value and back to 0
  trapezeU16: enumValue(), // trapeze shaped interpolation from 0 to a given value and back to 0
  u16Keyframes: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link CurveTypeValues}.
 * @category Animation
 */
export type CurveType = keyof typeof CurveTypeValues;

export interface DCurve {
  /** See {@link CurveTypeValues} for possible values. */
  type: number;
}

/**
 * Easing types.
 * @category Animation
 */
export const EasingTypeValues = {
  step: enumValue(0),
  linear: enumValue(),
  easeIn: enumValue(),
  easeOut: enumValue(),
  easeInEaseOut: enumValue(), // S curve
} as const;

/**
 * The names for the "enum" type {@link EasingTypeValues}.
 * @category Animation
 */
export type EasingType = keyof typeof EasingTypeValues;

export class DCurveTwoUInt8 implements DCurve {
  @serializable(1)
  type = CurveTypeValues.twoU8;

  @serializable(1)
  start = 0;

  @serializable(1)
  end = 0;

  @serializable(1)
  easing = EasingTypeValues.step;
}

export class DCurveTwoUInt16 implements DCurve {
  @serializable(1)
  type = CurveTypeValues.twoU16;

  @serializable(2)
  start = 0;

  @serializable(2)
  end = 0;

  @serializable(1)
  easing = EasingTypeValues.step;
}

export class DCurveTrapezeUInt8 implements DCurve {
  @serializable(1)
  type = CurveTypeValues.trapezeU8;

  @serializable(1)
  value = 0;

  @serializable(1)
  rampUpScale = 0;

  @serializable(1)
  rampDownScale = 0;

  @serializable(1)
  rampUpEasing = EasingTypeValues.step;

  @serializable(1)
  rampDownEasing = EasingTypeValues.step;
}

export class DCurveTrapezeUInt16 implements DCurve {
  @serializable(1)
  type = CurveTypeValues.trapezeU16;

  @serializable(2)
  value = 0;

  @serializable(1)
  rampUpScale = 0;

  @serializable(1)
  rampDownScale = 0;

  @serializable(1)
  rampUpEasing = EasingTypeValues.step;

  @serializable(1)
  rampDownEasing = EasingTypeValues.step;
}

export class KeyframeUInt16 {
  @serializable(2)
  time = 0;

  @serializable(2)
  value = 0;
}

export class DCurveUInt16Keyframes implements DCurve {
  @serializable(1)
  type = CurveTypeValues.u16Keyframes;

  keyframes?: KeyframeUInt16[];
  @serializable(2)
  keyframesOffset = 0;
  @serializable(1)
  keyframesLength = 0;
}

/**
 * Color types.
 * @category Animation
 */
export const ColorTypeValues = {
  palette: enumValue(0), // uses the global palette
  rgb: enumValue(), // stores actual rgb values
  lookup: enumValue(), // uses a scalar to lookup the color in a gradient
} as const;

/**
 * The names for the "enum" type {@link ColorTypeValues}.
 * @category Animation
 */
export type ColorType = keyof typeof ColorTypeValues;

export interface DColor {
  /** See {@link ColorTypeValues} for possible values. */
  type: number;
}

export class DColorPalette implements DColor {
  @serializable(1)
  type = ColorTypeValues.palette;

  @serializable(1)
  index = 0;
}

export class DColorRGB implements DColor {
  @serializable(1)
  type = ColorTypeValues.rgb;

  @serializable(1)
  rValue = 0;

  @serializable(1)
  gValue = 0;

  @serializable(1)
  bValue = 0;
}

export class DColorLookup implements DColor {
  @serializable(1)
  type = ColorTypeValues.lookup;

  lookupGradient?: ColorCurve;
  @serializable(2)
  lookupGradientIndex = 0;

  parameter?: DScalar;
  @serializable(2)
  parameterIndex = 0;
}

/**
 * Gradient types.
 * @category Animation
 */
export const ColorCurveTypeValues = {
  rainbow: enumValue(0), // basic programmatic rainbow gradient
  twoColors: enumValue(), // simple two-color gradient
  keyframes: enumValue(), // gradient with a few keyframes
} as const;

/**
 * The names for the "enum" type {@link ColorCurveTypeValues}.
 * @category Animation
 */
export type ColorCurveType = keyof typeof ColorCurveTypeValues;

export interface ColorCurve {
  /** See {@link ColorCurveTypeValues} for possible values. */
  type: number;
}

export class DGradientRainbow implements ColorCurve {
  @serializable(1)
  type = ColorCurveTypeValues.rainbow;

  // No data for now
}

export class DGradientTwoColors implements ColorCurve {
  @serializable(1)
  type = ColorCurveTypeValues.twoColors;

  start?: DColor;
  @serializable(2)
  startIndex = 0;

  end?: DColor;
  @serializable(2)
  endIndex = 0;

  @serializable(1)
  easing = EasingTypeValues.step;
}

export class KeyframeUInt16Easing {
  @serializable(2)
  time = 0;

  @serializable(1)
  index = 0; // palette index

  @serializable(1)
  easing = EasingTypeValues.step;
}

export class DGradientKeyframes implements ColorCurve {
  @serializable(1)
  type = ColorCurveTypeValues.keyframes;

  keyframes?: KeyframeUInt16Easing[];
  @serializable(2)
  keyframesOffset = 0;
  @serializable(1)
  keyframesLength = 0;
}
