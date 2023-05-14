import { assert } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Text as SvgText } from "react-native-svg";

import { LineChartProps } from "./LineChart";

export interface LineInfo {
  title: string;
  color: string;
  min: number;
  max: number;
}

export interface DynamicLinesChartProps
  extends Omit<LineChartProps, "points" | "lineColor" | "minY" | "maxY"> {
  linesInfo: LineInfo[];
}

export interface DynamicLinesChartHandle {
  push(x: number, yValues: number[]): void;
}

interface LinePoints extends LineInfo {
  points: string;
  labels: number[];
}

interface LinesData {
  xValues: number[];
  scale: number;
  lines: {
    yValues: number[];
    min: number;
    max: number;
    scale: number;
  }[];
}

// Plots multiple lines that share the same x values.
// Data is pushed dynamically.
export const DynamicLinesChart = React.forwardRef(function (
  {
    style,
    linesInfo,
    textColor,
    fontSize,
    title,
    strokeWidth,
    minX,
    maxX,
  }: DynamicLinesChartProps,
  ref: React.ForwardedRef<DynamicLinesChartHandle>
) {
  // Internal lines data
  const [lines, setLines] = React.useState<LinePoints[]>([]);
  const xLabelsRef = React.useRef<number[]>([]);
  const dataRef = React.useRef<LinesData>({
    xValues: [],
    scale: 1,
    lines: [],
  });

  // Initialization
  React.useEffect(() => {
    const data = dataRef.current;
    data.xValues.length = 0;
    data.lines = linesInfo.map((l) => ({
      yValues: [],
      min: l.min,
      max: l.max,
      scale: 1,
    }));
    setLines(
      linesInfo.map((l) => ({
        title: l.title,
        color: l.color,
        points: "",
        labels: [],
        min: l.min,
        max: l.max,
      }))
    );
  }, [linesInfo]);

  // View layout
  const [layout, setLayout] = React.useState({ width: 1, height: 1 });

  // Imperative handle
  React.useImperativeHandle(
    ref,
    () => ({
      // Add a new value for each line
      push(x: number, yValues: number[]): void {
        const data = dataRef.current;
        assert(data.lines.length === yValues.length);
        // X value and scaling
        data.xValues.push(x);
        const x0 = minX ?? data.xValues[0];
        const x1 = maxX ?? data.xValues.at(-1)!;
        const sx = x1 > x0 ? layout.width / (x1 - x0) : 1;
        const newScales: boolean[] = Array(data.lines.length).fill(
          data.scale !== sx
        );
        data.scale = sx;
        // Y values and scaling
        yValues.forEach((y, i) => {
          const line = data.lines[i];
          if (line.yValues.length) {
            line.min = Math.min(y, line.min);
            line.max = Math.max(y, line.max);
          }
          // Else line.min and max have already been initialized
          const sy =
            line.max > line.min ? layout.height / (line.max - line.min) : 1;
          if (!line.yValues.length || line.scale !== sy) {
            line.scale = sy;
            newScales[i] = true;
          }
          line.yValues.push(y);
        });
        // Update X labels
        // (assumes x1 value is representative of the space the labels take)
        const labelWidth = (Math.floor(Math.log10(x1)) + 1) * fontSize;
        const numLabelsX = Math.min(
          10,
          Math.ceil(layout.width / labelWidth / 2)
        );
        xLabelsRef.current = Array(numLabelsX)
          .fill(0)
          .map((_, i) =>
            Math.round(x0 + ((x1 - x0) * (i + 0.5)) / (numLabelsX - 1))
          );
        // Update state
        setLines((lines) => {
          assert(lines.length === yValues.length);
          yValues.forEach((y, i) => {
            // Coordinates
            const y0 = data.lines[i].min;
            const y1 = data.lines[i].max;
            const sy = data.lines[i].scale;
            const ptStr = (x: number, y: number) =>
              `${sx * (x - x0)},${sy * (y1 - y)}`;
            if (newScales[i]) {
              const xValues = data.xValues;
              lines[i].points = data.lines[i].yValues
                .map((y, j) => ptStr(xValues[j], y))
                .join(" ");
            } else {
              lines[i].points += " " + ptStr(x, y);
            }
            // Labels
            const numLabelsY = Math.min(
              10,
              Math.ceil(layout.height / fontSize / 3)
            );
            lines[i].labels = Array(numLabelsY)
              .fill(0)
              .map((_, i) => Math.round(y1 - ((y1 - y0) * i) / numLabelsY));
          });
          return [...lines]; // Return a copy to trigger a render
        });
      },
    }),
    [fontSize, layout.height, layout.width, maxX, minX]
  );

  return (
    <View style={style} onLayout={(ev) => setLayout(ev.nativeEvent.layout)}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        {title?.length && (
          <SvgText
            x={layout.width / 2}
            y={fontSize}
            textAnchor="middle"
            fontWeight="bold"
            fontSize={fontSize}
            fill={textColor}
          >
            {title}
          </SvgText>
        )}
        <>
          {xLabelsRef.current.map((x, i) => (
            <SvgText
              key={i}
              x={(layout.width * (i + 0.5)) / (xLabelsRef.current.length - 1)}
              y={layout.height - 1}
              textAnchor="middle"
              fontWeight="bold"
              fontSize={fontSize}
              fill={textColor}
            >
              {x}
            </SvgText>
          ))}
        </>
        {lines.map((l, i) => (
          <React.Fragment key={i}>
            <SvgText
              x={layout.width / 2}
              y={1.2 * (i + 2) * fontSize}
              textAnchor="middle"
              fontWeight="bold"
              fontSize={fontSize}
              fill={l.color}
            >
              {l.title}
            </SvgText>
            <>
              {l.labels.map((y, j) => (
                <SvgText
                  key={j}
                  x={1 + 2.5 * i * fontSize}
                  y={fontSize + (layout.height * j) / l.labels.length}
                  fontWeight="bold"
                  fontSize={fontSize}
                  fill={l.color}
                >
                  {y}
                </SvgText>
              ))}
            </>
            <Polyline
              points={l.points}
              strokeWidth={strokeWidth}
              fill="none"
              stroke={l.color}
            />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
});
