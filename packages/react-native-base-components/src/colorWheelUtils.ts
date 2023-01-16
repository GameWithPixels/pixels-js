import { ColorUtils } from "@systemic-games/pixels-core-animation";

/**
 * 2D point.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 2D shape with a color.
 */
export interface Shape {
  points: Point[];
  color: ColorUtils.IColor;
}

function clamp(value: number, maxValue = 1) {
  return Math.max(0, Math.min(maxValue, Math.floor(value)));
}

function arc(
  x: number,
  y: number,
  startAngle: number,
  endAngle: number,
  radius: number,
  segmentCount: number
): Point[] {
  if (radius === 0) {
    // Single point
    return [{ x, y }];
  } else {
    // Arc
    const pts: Point[] = [];
    const step = (endAngle - startAngle) / segmentCount;
    for (let i = 0; i <= segmentCount; ++i) {
      const angle = startAngle + i * step;
      pts.push({
        x: x + radius * Math.cos(angle),
        y: y + radius * Math.sin(angle),
      });
    }
    return pts;
  }
}

interface SliceParams {
  x: number;
  y: number;
  startAngle: number;
  endAngle: number;
  smallRadius: number;
  bigRadius: number;
  segmentCount: number;
}

function slice({
  x,
  y,
  startAngle,
  endAngle,
  smallRadius,
  bigRadius,
  segmentCount,
}: SliceParams): Point[] {
  return arc(x, y, startAngle, endAngle, smallRadius, segmentCount).concat(
    arc(x, y, endAngle, startAngle, bigRadius, segmentCount)
  );
}

interface SliceByIndexParams {
  x: number;
  y: number;
  radius: number;
  innerRadius?: number;
  sliceIndex: number;
  sliceCount: number;
  layerIndex: number;
  layerCount: number;
  segmentCount: number;
}

function sliceByIndex({
  x,
  y,
  radius,
  innerRadius,
  sliceIndex,
  sliceCount,
  layerIndex,
  layerCount,
  segmentCount,
}: SliceByIndexParams) {
  const minRadius = innerRadius ?? 0;
  const indexFactor = (radius - minRadius) / layerCount;
  const angleFactor = (2 * Math.PI) / sliceCount;
  return slice({
    x,
    y,
    startAngle: sliceIndex * angleFactor,
    endAngle: ((sliceIndex + 1) / sliceCount) * 2 * Math.PI,
    smallRadius: minRadius + layerIndex * indexFactor,
    bigRadius: minRadius + (layerIndex + 1) * indexFactor,
    segmentCount,
  });
}

/**
 * Parameters for generating a color wheel shape.
 */
export interface ColorWheelParams {
  x: number; // X coordinate of the wheel center.
  y: number; // Y coordinate of the wheel center.
  radius: number; // Wheel (outer) radius
  innerRadius?: number; // Wheel inner radius (optional).
  sliceCount: number; // Number of slices which is the number of color hues.
  layerCount: number; // Number of layers which is the number of shades for one color.
  segmentCount: number; // Number of segments for outer arc of a slice
  saturationPower?: number; // The colors saturation power used to generate the different shades.
  brightness?: number; // The colors brightness.
}

/**
 * Generates the shapes of the different colored parts of a color wheel.
 * See {@link ColorWheelParams} for the parameters.
 * @returns A list of shapes.
 */
export function generateColorWheel({
  x,
  y,
  radius,
  innerRadius,
  sliceCount,
  layerCount,
  segmentCount,
  saturationPower,
  brightness,
}: ColorWheelParams): Shape[] {
  // Calculate color for a specific slice
  function computeColor(
    sliceIndex: number,
    layerIndex: number
  ): ColorUtils.IColor {
    // Inverse the hue value to match rendering of Unity app
    const hue = ((sliceCount - sliceIndex - 0.5) / sliceCount) % 1;
    const sat = Math.pow((layerIndex + 1) / layerCount, saturationPower ?? 1.2);
    return ColorUtils.hsvToRgb({ h: hue, s: sat, v: brightness ?? 1 });
  }

  const shapes: Shape[] = [];
  // Iterate over each circular layer of the color wheel
  for (let layerIndex = 0; layerIndex < layerCount; ++layerIndex) {
    // Divide the layer in slices
    for (let sliceIndex = 0; sliceIndex < sliceCount; ++sliceIndex) {
      const points = sliceByIndex({
        x,
        y,
        radius,
        innerRadius,
        sliceIndex,
        sliceCount,
        layerIndex,
        layerCount,
        segmentCount,
      });
      const color = computeColor(sliceIndex, layerIndex);
      shapes.push({ points, color });
    }
  }
  return shapes;
}

interface ColorWheelPosition {
  sliceIndex: number;
  layerIndex: number;
  colorWheel?: "bright" | "dim";
}

function toColorWheelPosition(
  color: ColorUtils.IColor,
  sliceCount: number,
  layerCount: number,
  dimBrightness: number
): ColorWheelPosition {
  const hsv = ColorUtils.rgbToHsv(color);
  const layerIndex = clamp(hsv.s * layerCount, layerCount - 1);
  const sliceIndex = sliceCount - 1 - clamp(hsv.h * sliceCount, sliceCount - 1);
  const epsilon = 0.01;
  const colorWheel =
    hsv.v + epsilon >= 1
      ? "bright"
      : Math.abs(hsv.v - dimBrightness) <= epsilon
      ? "dim"
      : undefined;
  return { sliceIndex, layerIndex, colorWheel };
}

/**
 * Parameters for generating the dim and bright color wheels.
 */
export interface ColorWheelsGenParams
  extends Omit<ColorWheelParams, "saturationPower" | "brightness"> {
  dimBrightness: number;
}

/**
 * Returns the shape of color wheel slice containing the given color,
 * or undefined if the color is outside of the dim and bright color wheels.
 * @param color The color to match.
 * @param wheelsGenParams The parameters used to generate the dim and bright color wheels.
 * @returns The shape of the slice containing the color or undefined.
 */
export function findColorWheelSlice(
  color: ColorUtils.IColor,
  wheelsGenParams: ColorWheelsGenParams
): Point[] | undefined {
  const pos = toColorWheelPosition(
    color,
    wheelsGenParams.sliceCount,
    wheelsGenParams.layerCount,
    wheelsGenParams.dimBrightness
  );
  if (pos.colorWheel) {
    return sliceByIndex({
      ...wheelsGenParams,
      sliceIndex: pos.sliceIndex,
      layerIndex: pos.layerIndex,
    });
  }
}
