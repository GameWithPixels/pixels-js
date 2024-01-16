import { Color, ColorUtils } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { RadioButton, useTheme } from "react-native-paper";
import Svg, { Defs, G, Polygon, RadialGradient, Stop } from "react-native-svg";

import {
  ColorWheelParams,
  generateColorWheel,
  Point,
  sliceByIndex,
  toColorWheelPosition,
} from "~/features/colorWheelUtils";

function colorToString(color: ColorUtils.IColor, factor = 1): string {
  return ColorUtils.colorToString(
    factor === 1
      ? color
      : {
          r: color.r * factor,
          g: color.g * factor,
          b: color.b * factor,
        }
  );
}

function getParams(
  wheelParams?: ColorWheelParams & { dimBrightness: number }
): ColorWheelParams & { dimBrightness: number } {
  return wheelParams
    ? { ...wheelParams }
    : {
        x: 50,
        y: 50,
        radius: 50,
        innerRadius: 15,
        sliceCount: 16,
        layerCount: 2,
        segmentCount: 16,
        brightness: 1,
        dimBrightness: 0.5,
      };
}

/**
 * Transform coordinate points into a single string for svg path.
 * @param points Array of points representing a 2D shape
 */
function toStringPath(points?: Point[]) {
  return points?.map(({ x, y }) => `${x},${y}`).join(" ");
}

export type ColorWheelBrightness = "dim" | "normal";

/**
 * Props for customizing the colorWheel and its behavior
 */
export interface ColorWheelProps extends ViewProps {
  color?: Readonly<ColorUtils.IColor>;
  onColorChange?: (color: ColorUtils.IColor) => void;
  wheelParams?: Readonly<ColorWheelParams & { dimBrightness: number }>;
}

/**
 * Generate the color wheel by drawing the colors polygons and the selector
 */
export function ColorWheel({
  color,
  onColorChange,
  wheelParams,
  ...props
}: ColorWheelProps) {
  const [selectedBrightness, setSelectedBrightness] =
    React.useState<ColorWheelBrightness>("normal");
  const { params, brightness, selectionPoints } = React.useMemo(() => {
    const params = getParams(wheelParams);
    if (!color) {
      return { params, brightness: selectedBrightness };
    } else {
      const wheelPos = toColorWheelPosition(
        color,
        params.sliceCount,
        params.layerCount,
        params.dimBrightness
      );
      const brightness = wheelPos.brightness ?? selectedBrightness;
      const selectionPoints = toStringPath(
        sliceByIndex({
          ...params,
          ...wheelPos,
        })
      );
      return { params, brightness, selectionPoints };
    }
  }, [color, selectedBrightness, wheelParams]);

  const { colors } = useTheme();
  return (
    <View {...props}>
      {/* Color wheel */}
      <View style={{ width: "100%", aspectRatio: 1 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Wheel
            wheelParams={
              selectedBrightness === "normal"
                ? params
                : { ...params, brightness: params.dimBrightness }
            }
            onColorChange={onColorChange}
          />
          {/* Highlight selected color */}
          {selectionPoints && color && selectedBrightness === brightness && (
            <Polygon
              points={selectionPoints}
              fill="none"
              stroke={colors.primary}
              strokeWidth="1"
              onPress={() => onColorChange?.(new Color(color))}
            />
          )}
        </Svg>
      </View>
      {/* Dimness */}
      <RadioButton.Group
        onValueChange={setSelectedBrightness as (value: string) => void}
        value={selectedBrightness}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          {/* <RadioButton.Item value="bright" label="Bright" /> */}
          <RadioButton.Item value="normal" label="Normal" />
          <RadioButton.Item value="dim" label="Dim" />
        </View>
      </RadioButton.Group>
    </View>
  );
}

// Create each polygon with the colors on the wheel
function Wheel({
  wheelParams,
  onColorChange,
}: { wheelParams: ColorWheelParams } & Pick<ColorWheelProps, "onColorChange">) {
  return (
    <>
      {generateColorWheel(wheelParams).map((s) => {
        const colorStr = colorToString(s.color);
        return (
          <G key={colorStr}>
            <Defs>
              <RadialGradient id={colorStr} cx="50%" cy="50%" r="1">
                <Stop
                  offset="0%"
                  stopColor={
                    // brightness === "bright" ? colorToString(s.color, 2) :
                    colorStr
                  }
                  stopOpacity="1"
                />
                <Stop
                  offset="100%"
                  stopColor={
                    // brightness === "bright" ? colorStr :
                    colorToString(s.color, 0.5)
                  }
                  stopOpacity="1"
                />
              </RadialGradient>
            </Defs>
            <Polygon
              points={toStringPath(s.points)}
              fill={
                wheelParams.brightness === 1 ? colorStr : `url(#${colorStr})`
              }
              onPress={() => onColorChange?.(new Color(s.color))}
            />
          </G>
        );
      })}
    </>
  );
}
