import React from "react";
import { View, ViewStyle } from "react-native";
import Svg, { Polyline, Rect, Text as SvgText } from "react-native-svg";

interface Point {
  x: number;
  y: number;
}

export interface LineChartProps {
  style?: ViewStyle;
  points: Point[];
  fontSize: number;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

// Points must be sorted by X
export function LineChart({
  style,
  points,
  fontSize,
  minX,
  minY,
  maxX,
  maxY,
}: LineChartProps) {
  // Boundaries
  const { x0, x1, y0, y1 } = React.useMemo(() => {
    const x0 = minX ?? points[0]?.x ?? 0;
    const x1 = maxX ?? points.at(-1)?.x ?? 1;
    const yValues =
      minY === undefined || maxY === undefined
        ? points.map((p) => p.y)
        : undefined;
    const y0 = minY ?? (yValues?.length ? Math.min(...yValues) : 0);
    const y1 = maxY ?? (yValues?.length ? Math.max(...yValues) : 1);
    return { x0, x1, y0, y1 };
  }, [points, minX, minY, maxX, maxY]);

  // View layout
  const [layout, setLayout] = React.useState({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });

  // Points to plot
  const pts = React.useMemo(() => {
    const sx = x1 <= x0 ? 1 : layout.width / (x1 - x0);
    const sy = y1 <= y0 ? 1 : layout.height / (y1 - y0);
    return points.map((p) => `${sx * (p.x - x0)},${sy * (y1 - p.y)}`).join(" ");
  }, [points, layout, x0, x1, y0, y1]);

  // Some UI values
  const labelWidth = (Math.floor(Math.log10(x1)) + 1) * fontSize;
  const numLabelsX = Math.min(10, Math.ceil(layout.width / labelWidth / 2));
  const numLabelsY = Math.min(10, Math.ceil(layout.height / fontSize / 3));

  return (
    <View style={style} onLayout={(ev) => setLayout(ev.nativeEvent.layout)}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        <Rect x={0} y={0} width="100%" height="100%" fill="gray" />
        <Polyline points={pts} fill="none" stroke="blue" />
        {Array(numLabelsX)
          .fill(0)
          .map((_, i) => (
            <SvgText
              key={i}
              x={(layout.width * (i + 0.5)) / (numLabelsX - 1)}
              y={layout.height - 1}
              textAnchor="middle"
              fontWeight="bold"
              fontSize={fontSize}
              fill="cyan"
            >
              {Math.round(x0 + ((x1 - x0) * (i + 0.5)) / (numLabelsX - 1))}
            </SvgText>
          ))}
        {Array(numLabelsY)
          .fill(0)
          .map((_, i) => (
            <SvgText
              key={100 + i}
              x={1}
              y={fontSize + (layout.height * i) / numLabelsY}
              fontWeight="bold"
              fontSize={fontSize}
              fill="cyan"
            >
              {Math.round(y1 - ((y1 - y0) * i) / numLabelsY)}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}
