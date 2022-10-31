import { IColor } from "@systemic-games/pixels-core-animation";
import { Center } from "native-base";
import React, { useState } from "react";
import Svg, { Polygon } from "react-native-svg";

import {
  findColorWheelSlice,
  generateColorWheel,
  Point,
} from "../colorWheelUtils";

/**
 * Transform coordinate points into a single string for svg path.
 * @param points Array of points representing a 2D shape
 */
export function toStringPath(points?: Point[]) {
  return points?.map(({ x, y }) => `${x},${y}`).join(" ");
}
export function toStringColor(color: IColor): string {
  function toHex(v: number) {
    const byte = Math.max(0, Math.min(255, Math.round(255 * v)));
    return ("0" + byte.toString(16)).slice(-2);
  }
  return "#" + toHex(color.r) + toHex(color.g) + toHex(color.b);
}

/**
 * Props for customizing the colorWheel and its behavior
 */
export interface ColorWheelProps {
  onSelectColor: React.Dispatch<React.SetStateAction<string>>; // action to initiate after selecting a color on the wheel
}
/**
 * Generate the color wheel by drawing the colors polygons and the selector
 */
export function ColorWheel(props: ColorWheelProps) {
  const [selectedColor, setSelectedColor] = React.useState<IColor>();
  const wheelParams = {
    x: 50,
    y: 50,
    radius: 49,
    startRadius: 10,
    sliceCount: 16,
    layerCount: 3,
    segmentCount: 16,
    brightness: 1,
    dimBrightness: 0.35,
  };

  /**
   * Create each polygon representing the colors on the wheel based on the generated shapes
   */
  const polygons = () => {
    const shapes = generateColorWheel(wheelParams);
    return (
      <>
        {shapes.map((s) => (
          <Polygon
            points={toStringPath(s.points)}
            fill={toStringColor(s.color)}
            onPress={() => {
              setSelectedColor(s.color);
              console.log(toStringColor(s.color));
              props.onSelectColor(toStringColor(s.color));
            }}
          />
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
  const [wheel] = useState(() => polygons());
  return (
    <Center>
      <Svg height={300} width={300} viewBox="0 0 100 100">
        {wheel}
        {selector()}
      </Svg>
    </Center>
  );
}
