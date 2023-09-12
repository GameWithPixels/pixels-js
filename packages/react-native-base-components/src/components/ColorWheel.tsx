import { Color, ColorUtils } from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View } from "react-native";
import { RadioButton } from "react-native-paper";
import Svg, { Defs, G, Polygon, RadialGradient, Stop } from "react-native-svg";

import { BaseHStack } from "./BaseHStack";
import { BaseVStack } from "./BaseVStack";
import {
  findColorWheelSlice,
  generateColorWheel,
  Point,
} from "../colorWheelUtils";
import { BaseFlexProps } from "../expandShorthandStyle";

/**
 * Transform coordinate points into a single string for svg path.
 * @param points Array of points representing a 2D shape
 */
export function toStringPath(points?: Point[]) {
  return points?.map(({ x, y }) => `${x},${y}`).join(" ");
}

/**
 * Convert a color object to a HTML color code.
 * @param color RBG color object.
 * @returns A HTML color code.
 */
export function toStringColor(color: ColorUtils.IColor): string {
  function toHex(v: number) {
    const byte = Math.max(0, Math.min(255, Math.round(255 * v)));
    return byte.toString(16).padStart(2, "0");
  }
  return "#" + toHex(color.r) + toHex(color.g) + toHex(color.b);
}

export type ColorWheelBrightness = "dim" | "normal" | "bright";

/**
 * Props for customizing the colorWheel and its behavior
 */
export interface ColorWheelProps extends BaseFlexProps {
  initialColor?: ColorUtils.IColor;
  onSelectColor?: (color: string) => void; // action to initiate after selecting a color on the wheel
  initialBrightness?: ColorWheelBrightness;
  wheelParams?: WheelParams;
}

/**
 * Parameter for generating the shapes in {@link ColorWheel} component.
 */
export interface WheelParams {
  x: number;
  y: number;
  radius: number;
  innerRadius: number;
  sliceCount: number;
  layerCount: number;
  segmentCount: number;
  brightness: number;
  dimBrightness: number;
}

/**
 * Generate the color wheel by drawing the colors polygons and the selector
 */
export function ColorWheel({
  initialColor,
  onSelectColor,
  initialBrightness = "normal",
  wheelParams,
  ...flexProps
}: ColorWheelProps) {
  const [selectedColor, setSelectedColor] = React.useState<ColorUtils.IColor>(
    initialColor ?? Color.white
  );
  const [colorBrightness, setBrightness] =
    React.useState<ColorWheelBrightness>(initialBrightness);
  const myParams = wheelParams ?? {
    x: 50,
    y: 50,
    radius: 50,
    innerRadius: 15,
    sliceCount: 16,
    layerCount: 2,
    segmentCount: 16,
    brightness: 1,
    dimBrightness: 0,
  };

  /**
   * Create each polygon representing the colors on the wheel based on the generated shapes
   */
  const polygons = () => {
    switch (initialBrightness) {
      case "dim":
        myParams.brightness = 0.5;
        break;
      case "normal":
        myParams.brightness = 1;
        break;
      case "bright":
        myParams.brightness = 2;
        break;
      default:
        assertNever(initialBrightness);
    }
    const shapes = generateColorWheel(myParams);
    return (
      <>
        {shapes.map((s) => {
          const colorStr = toStringColor(s.color);
          return (
            <G key={colorStr}>
              <Defs>
                <RadialGradient id={colorStr} cx="50%" cy="50%" r="1">
                  <Stop
                    offset="0%"
                    stopColor={
                      initialBrightness === "bright"
                        ? colorStr
                        : toStringColor({
                            r: s.color.r * 2,
                            g: s.color.g * 2,
                            b: s.color.b * 2,
                          })
                    }
                    stopOpacity="1"
                  />
                  <Stop
                    offset="100%"
                    stopColor={
                      initialBrightness === "bright"
                        ? toStringColor({
                            r: s.color.r / 2,
                            g: s.color.g / 2,
                            b: s.color.b / 2,
                          })
                        : colorStr
                    }
                    stopOpacity="1"
                  />
                </RadialGradient>
              </Defs>
              <Polygon
                points={toStringPath(s.points)}
                fill={
                  initialBrightness === "normal"
                    ? colorStr
                    : `url(#${colorStr})`
                }
                onPress={() => {
                  setSelectedColor(s.color);
                  onSelectColor?.(colorStr);
                }}
              />
            </G>
          );
        })}
      </>
    );
  };

  /**
   * Create the selector polygon highlighting the selected color
   */
  const selector = () => {
    return (
      selectedColor && (
        <Polygon
          points={toStringPath(findColorWheelSlice(selectedColor, myParams))}
          fill="none"
          stroke="black"
          strokeWidth="1"
        />
      )
    );
  };

  const changeBrightness = React.useCallback(
    (value: string) => setBrightness(value as ColorWheelBrightness),
    []
  );
  return (
    <BaseVStack w="100%" alignItems="center" {...flexProps}>
      {/* Dimness selection */}
      <RadioButton.Group
        onValueChange={changeBrightness}
        value={colorBrightness}
      >
        <BaseHStack w="100%" justifyContent="center">
          <RadioButton.Item value="dim" label="Dim" />
          <RadioButton.Item value="normal" label="Normal" />
          <RadioButton.Item value="bright" label="Bright" />
        </BaseHStack>
      </RadioButton.Group>
      {/* Color wheel */}
      <View style={{ width: "100%", aspectRatio: 1 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          {polygons()}
          {selector()}
        </Svg>
      </View>
    </BaseVStack>
  );
}
