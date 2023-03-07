import { ColorUtils } from "@systemic-games/pixels-core-animation";
import { Button } from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";
import Svg, { Defs, Polygon, RadialGradient, Stop } from "react-native-svg";

import {
  findColorWheelSlice,
  generateColorWheel,
  Point,
} from "../colorWheelUtils";
import { FastBox } from "./FastBox";
import { FastButton } from "./FastButton";
import { FastVStack } from "./FastVStack";

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

export const enum ColorWheelColorType {
  dim,
  normal,
  bright,
}

/**
 * Props for customizing the colorWheel and its behavior
 */
export interface ColorWheelProps {
  initialColor?: string;
  onSelectColor: ((color: string) => void) | null | undefined; // action to initiate after selecting a color on the wheel
  wheelParams?: WheelParams;
  colorType?: ColorWheelColorType;
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
export function ColorWheel(props: ColorWheelProps) {
  const [selectedColor, setSelectedColor] = React.useState<ColorUtils.IColor>();
  const [wheelColorType, setWheelColorType] = React.useState(
    ColorWheelColorType.normal
  );
  const [colorBrightness, setColorBrightness] = React.useState(1);
  const buttonHighlightColor: ColorType = "pixelColors.highlightGray";
  const wheelParams = props.wheelParams
    ? props.wheelParams
    : {
        x: 40,
        y: 40,
        radius: 40,
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
    wheelParams.brightness = colorBrightness;
    const shapes = generateColorWheel(wheelParams);
    return (
      <>
        {shapes.map((s, i) => (
          <FastBox key={i}>
            <Defs>
              <RadialGradient
                id={toStringColor(s.color)}
                cx="50%"
                cy="50%"
                r="1"
              >
                <Stop
                  offset="0%"
                  stopColor={
                    wheelColorType === ColorWheelColorType.bright
                      ? toStringColor(s.color)
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
                    wheelColorType === ColorWheelColorType.bright
                      ? toStringColor({
                          r: s.color.r / 2,
                          g: s.color.g / 2,
                          b: s.color.b / 2,
                        })
                      : toStringColor(s.color)
                  }
                  stopOpacity="1"
                />
              </RadialGradient>
            </Defs>
            <Polygon
              points={toStringPath(s.points)}
              fill={
                wheelColorType === ColorWheelColorType.normal
                  ? toStringColor(s.color)
                  : `url(#${toStringColor(s.color)})`
              }
              onPress={() => {
                setSelectedColor(s.color);
                props.onSelectColor?.(toStringColor(s.color));
              }}
            />
          </FastBox>
        ))}
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
          points={toStringPath(findColorWheelSlice(selectedColor, wheelParams))}
          fill="none"
          stroke="black"
          strokeWidth="1"
        />
      )
    );
  };
  return (
    <FastVStack w="100%" alignItems="center">
      <Button.Group mb={2} isAttached w="100%">
        <FastButton
          flex={1}
          bgColor={
            wheelColorType === ColorWheelColorType.dim
              ? buttonHighlightColor
              : "primary.500"
          }
          onPress={() => {
            setWheelColorType(ColorWheelColorType.dim);
            setColorBrightness(0.5);
          }}
        >
          Dim
        </FastButton>
        <FastButton
          flex={1}
          bgColor={
            wheelColorType === ColorWheelColorType.normal
              ? buttonHighlightColor
              : "primary.500"
          }
          onPress={() => {
            setWheelColorType(ColorWheelColorType.normal);
            setColorBrightness(1);
          }}
        >
          Normal
        </FastButton>
        <FastButton
          flex={1}
          bgColor={
            wheelColorType === ColorWheelColorType.bright
              ? buttonHighlightColor
              : "primary.500"
          }
          onPress={() => {
            setWheelColorType(ColorWheelColorType.bright);
            setColorBrightness(2);
          }}
        >
          Bright
        </FastButton>
      </Button.Group>
      <Svg height={300} width={300} viewBox="0 0 80 80">
        {polygons()}
        {selector()}
      </Svg>
    </FastVStack>
  );
}
