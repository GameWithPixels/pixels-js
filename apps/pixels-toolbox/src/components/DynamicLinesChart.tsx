import { assert } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Text as SvgText } from "react-native-svg";

import { LineChartProps } from "./LineChart";

import useForceUpdate from "~/features/hooks/useForceUpdate";

export interface LineInfo {
  title: string;
  color: string;
  min?: number;
  max?: number;
}

export interface DynamicLinesChartEntry {
  x: number;
  yValues: number[];
}

export interface DynamicLinesChartProps
  extends Omit<LineChartProps, "points" | "lineColor" | "minY" | "maxY"> {
  linesInfo: readonly LineInfo[];
  points?: readonly DynamicLinesChartEntry[];
}

export interface DynamicLinesChartHandle {
  push(x: number, yValues: number[]): void;
}

interface LinePoints extends LineInfo {
  points: string;
  labels: number[];
}

interface Data {
  // Render data
  render: {
    xLabels: number[];
    lines: LinePoints[];
  };
  // Source data
  source: {
    xValues: number[];
    scale: number;
    lines: {
      yValues: number[];
      scale: number;
      min: number;
      max: number;
    }[];
  };
}

// Plots multiple lines that share the same x values.
// Data is pushed dynamically.
export const DynamicLinesChart = React.forwardRef(function (
  {
    style,
    points,
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
  const forceUpdate = useForceUpdate();

  const getDefaultDataRef = React.useCallback(
    () => ({
      render: {
        xLabels: [],
        lines: linesInfo.map((l) => ({
          points: "",
          labels: [],
          ...l,
        })),
      },
      source: {
        xValues: [],
        scale: 1,
        lines: linesInfo.map((l) => ({
          yValues: [],
          scale: 1,
          min: l.min ?? NaN,
          max: l.max ?? NaN,
        })),
      },
    }),
    [linesInfo]
  );

  const dataRef = React.useRef<Data>();
  if (!dataRef.current) {
    dataRef.current = getDefaultDataRef();
  }

  // View layout
  const [layout, setLayout] = React.useState({ width: 1, height: 1 });

  // Add new points
  const pushData = React.useCallback(
    (x: number, yValues: number[]) => {
      assert(dataRef.current);
      const rdrData = dataRef.current.render;
      const srcData = dataRef.current.source;
      assert(srcData.lines.length === yValues.length, "");
      const area = { w: layout.width, h: layout.height - 2.5 * fontSize };
      // X value and scaling
      srcData.xValues.push(x);
      const x0 = minX ?? srcData.xValues[0];
      const x1 = maxX ?? srcData.xValues.at(-1)!;
      const sx = x1 > x0 ? area.w / (x1 - x0) : 1;
      const newScales: boolean[] = Array(srcData.lines.length).fill(
        srcData.scale !== sx
      );
      srcData.scale = sx;
      // Y values and scaling
      yValues.forEach((y, i) => {
        const line = srcData.lines[i];
        if (!line.yValues.length) {
          if (isNaN(line.min)) {
            line.min = y;
          }
          if (isNaN(line.max)) {
            line.max = y;
          }
        } else {
          line.min = Math.min(y, line.min);
          line.max = Math.max(y, line.max);
        }
        const sy = line.max > line.min ? area.h / (line.max - line.min) : 1;
        if (!line.yValues.length || line.scale !== sy) {
          line.scale = sy;
          newScales[i] = true;
        }
        line.yValues.push(y);
      });
      // Update X labels
      // (assumes x1 value is representative of the space the labels take)
      const labelWidth = (Math.floor(Math.log10(x1)) + 1) * fontSize;
      const numLabelsX = Math.min(10, Math.ceil(area.w / labelWidth / 2));
      rdrData.xLabels = Array(numLabelsX)
        .fill(0)
        .map((_, i) =>
          Math.round(x0 + ((x1 - x0) * (i + 0.5)) / (numLabelsX - 1))
        );
      // Update state
      assert(rdrData.lines.length === yValues.length);
      yValues.forEach((y, i) => {
        // Coordinates
        const y0 = srcData.lines[i].min;
        const y1 = srcData.lines[i].max;
        const sy = srcData.lines[i].scale;
        const ptStr = (x: number, y: number) =>
          `${sx * (x - x0)},${sy * (y1 - y)}`;
        if (newScales[i]) {
          const xValues = srcData.xValues;
          rdrData.lines[i].points = srcData.lines[i].yValues
            .map((y, j) => ptStr(xValues[j], y))
            .join(" ");
        } else {
          rdrData.lines[i].points += " " + ptStr(x, y);
        }
        // Labels
        const numLabelsY = Math.min(10, Math.ceil(area.h / fontSize / 3));
        rdrData.lines[i].labels = Array(numLabelsY)
          .fill(0)
          .map((_, i) => Math.round(y1 - ((y1 - y0) * i) / numLabelsY));
      });
    },
    [fontSize, layout.height, layout.width, maxX, minX]
  );

  // Render points
  React.useEffect(() => {
    if (points?.length || dataRef.current?.source.xValues.length) {
      dataRef.current = getDefaultDataRef();
      points?.forEach((p) => pushData(p.x, p.yValues));
      forceUpdate();
    }
  }, [forceUpdate, getDefaultDataRef, points, pushData]);

  // Imperative handle
  React.useImperativeHandle(
    ref,
    () => ({
      // Add a new value for each line
      push(x: number, yValues: number[]): void {
        pushData(x, yValues);
        forceUpdate();
      },
    }),
    [forceUpdate, pushData]
  );

  const rdrData = dataRef.current?.render;
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
            y={layout.height - 1}
            textAnchor="middle"
            fontWeight="bold"
            fontSize={fontSize}
            fill={textColor}
          >
            {title}
          </SvgText>
        )}
        <>
          {rdrData?.xLabels.map((x, i) => (
            <SvgText
              key={i}
              x={(layout.width * (i + 0.5)) / (rdrData.xLabels.length - 1)}
              y={layout.height - 1.25 * fontSize}
              textAnchor="middle"
              fontSize={fontSize}
              fill={textColor}
            >
              {x}
            </SvgText>
          ))}
        </>
        {rdrData?.lines.map((l, i) => (
          <React.Fragment key={i}>
            <SvgText
              x={layout.width / 2}
              y={(1.2 * i + 1) * fontSize}
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
