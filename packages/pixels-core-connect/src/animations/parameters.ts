import { enumValue, serializable } from "@systemic-games/pixels-core-utils";

import { Pointer } from "./profileBuffer";

// Scalar types
export const ScalarTypeValues = {
  ScalarType_Unknown: enumValue(0),
  ScalarType_UInt8_t: enumValue(), // 8-bit value
  ScalarType_UInt16_t: enumValue(), // 16-bit value
  ScalarType_Global: enumValue(),
  ScalarType_Lookup: enumValue(),

  // After this are Curve types
  CurveType_TwoUInt8: enumValue(), // simple interpolation between two 8 bit values
  CurveType_TwoUInt16: enumValue(), // simple interpolation between two 16 bit values
  CurveType_TrapezeUInt8: enumValue(), // trapeze shaped interpolation from 0 to a given value and back to 0
  CurveType_TrapezeUInt16: enumValue(), // trapeze shaped interpolation from 0 to a given value and back to 0
  CurveType_UInt16Keyframes: enumValue(),
} as const;

// Color types
export const ColorTypeValues = {
  ColorType_Unknown: enumValue(0),
  ColorType_Palette: enumValue(), // uses the global palette
  ColorType_RGB: enumValue(), // stores actual rgb values
  ColorType_Lookup: enumValue(), // uses a scalar to lookup the color in a gradient
  // After this are gradient types
  GradientType_Rainbow: enumValue(), // basic programmatic rainbow gradient
  GradientType_TwoColors: enumValue(), // simple two-color gradient
  GradientType_Keyframes: enumValue(), // gradient with a few keyframes
} as const;

export const GlobalTypeValues = {
  GlobalType_Unknown: enumValue(0),
  GlobalType_NormalizedCurrentFace: enumValue(),
} as const;

export const EasingTypeValues = {
  EasingType_Unknown: enumValue(0),
  EasingType_Step: enumValue(),
  EasingType_Linear: enumValue(),
  EasingType_EaseIn: enumValue(),
  EasingType_EaseOut: enumValue(),
  EasingType_EaseInEaseOut: enumValue(), // S curve
  // Etc...
} as const;

export class DScalar {
  @serializable(1)
  type = ScalarTypeValues.ScalarType_Unknown;
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
  globalType = GlobalTypeValues.GlobalType_Unknown;
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
  easing = EasingTypeValues.EasingType_Unknown;
}

export class DCurveTwoUInt16 extends DCurve {
  @serializable(2)
  start = 0;
  @serializable(2)
  end = 0;
  @serializable(1)
  easing = EasingTypeValues.EasingType_Unknown;
}

export class DCurveTrapezeUInt8 extends DCurve {
  @serializable(1)
  value = 0;
  @serializable(1)
  rampUpScale = 0;
  @serializable(1)
  rampDownScale = 0;
  @serializable(1)
  rampUpEasing = EasingTypeValues.EasingType_Unknown;
  @serializable(1)
  rampDownEasing = EasingTypeValues.EasingType_Unknown;
}

export class DCurveTrapezeUInt16 extends DCurve {
  @serializable(2)
  value = 0;
  @serializable(1)
  rampUpScale = 0;
  @serializable(1)
  rampDownScale = 0;
  @serializable(1)
  rampUpEasing = EasingTypeValues.EasingType_Unknown;
  @serializable(1)
  rampDownEasing = EasingTypeValues.EasingType_Unknown;
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
  type = ColorTypeValues.ColorType_Unknown;
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
  easing = EasingTypeValues.EasingType_Unknown;
}
// size: 6 bytes

export class KeyframeUInt16Easing {
  @serializable(2)
  time = 0;
  @serializable(1)
  index = 0; // palette index
  @serializable(1)
  easing = EasingTypeValues.EasingType_Unknown;
}

export class DGradientKeyframes extends DGradient {
  keyframes: KeyframeUInt16Easing[] = [];
}

export class DScalarPtr extends Pointer<DScalar> {}
export class DCurvePtr extends Pointer<DCurve> {}
export class DColorPtr extends Pointer<DColor> {}
export class DGradientPtr extends Pointer<DGradient> {}
