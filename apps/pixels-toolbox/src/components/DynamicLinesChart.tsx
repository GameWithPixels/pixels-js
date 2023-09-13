import { assert } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Text as SvgText } from "react-native-svg";

import { LineChartProps } from "./LineChart";

import { useForceUpdate } from "~/features/hooks/useForceUpdate";

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
    origin: number;
    scale: number;
    lines: LinePoints[];
  };
  // Source data
  source: {
    xValues: number[];
    min: number;
    max: number;
    scale: number;
    lines: {
      yValues: number[];
      min: number;
      max: number;
      scale: number;
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
        origin: 0,
        scale: 0,
        lines: linesInfo.map((l) => ({
          points: "",
          labels: [],
          origin: 0,
          ...l,
        })),
      },
      source: {
        xValues: [],
        min: 0,
        max: 0,
        scale: 0,
        lines: linesInfo.map((l) => ({
          yValues: [],
          scale: 0,
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
  const area = { w: layout.width, h: layout.height - 2.5 * fontSize };

  // Add new points
  const pushData = React.useCallback(
    (x: number, yValues: number[]) => {
      assert(dataRef.current);
      const srcData = dataRef.current.source;
      assert(srcData.lines.length === yValues.length);
      // X value and scaling
      srcData.xValues.push(x);
      const x0 = minX ?? srcData.xValues[0];
      const x1 = maxX ?? srcData.xValues.at(-1)!;
      const sx = x1 > x0 ? area.w / (x1 - x0) : 1;
      srcData.min = x0;
      srcData.max = x1;
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
        line.scale = line.max > line.min ? area.h / (line.max - line.min) : 1;
        line.yValues.push(y);
      });
    },
    [area.h, area.w, maxX, minX]
  );
  const update = React.useCallback(() => {
    assert(dataRef.current);
    const srcData = dataRef.current.source;
    const rdrData = dataRef.current.render;
    const { min: x0, max: x1, scale: sx } = srcData;
    // Update X labels
    // (assumes x1 value is representative of the space the labels take)
    const labelWidth = Math.floor(Math.log10(Math.abs(x1)) + 1) * fontSize;
    const numLabelsX = Math.min(10, Math.ceil(area.w / labelWidth / 2));
    rdrData.xLabels = Array(numLabelsX)
      .fill(0)
      .map((_, i) =>
        Math.round(x0 + ((x1 - x0) * (i + 0.5)) / (numLabelsX - 1))
      );
    // Update state
    assert(srcData.lines.length === rdrData.lines.length);
    rdrData.origin = x0;
    rdrData.scale = sx;
    srcData.lines.forEach((srcLine, i) => {
      // Coordinates
      const { min: y0, max: y1, scale: sy } = srcLine;
      const scale = sy / sx;
      const ptStr = (x: number, y: number) => `${x},${scale * (y1 - y)}`;
      // Regenerate coordinates
      const xValues = srcData.xValues;
      const line = rdrData.lines[i];
      line.points = srcLine.yValues
        .map((y, j) => ptStr(xValues[j], y))
        .join(" ");
      // Labels
      const numLabelsY = Math.min(10, Math.ceil(area.h / fontSize / 3));
      line.labels = Array(numLabelsY)
        .fill(0)
        .map((_, i) => Math.round(y1 - ((y1 - y0) * i) / numLabelsY));
    });
    forceUpdate();
  }, [area.h, area.w, fontSize, forceUpdate]);

  // Render points
  React.useEffect(() => {
    if (points?.length || dataRef.current?.source.xValues.length) {
      dataRef.current = getDefaultDataRef();
      points?.forEach((p) => pushData(p.x, p.yValues));
      update();
    }
  }, [getDefaultDataRef, points, pushData, update]);

  // Imperative handle
  React.useImperativeHandle(
    ref,
    () => ({
      // Add a new value for each line
      push(x: number, yValues: number[]): void {
        pushData(x, yValues);
        update();
      },
    }),
    [pushData, update]
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
              strokeWidth={strokeWidth && strokeWidth / rdrData.scale}
              fill="none"
              stroke={l.color}
              originX={rdrData.origin}
              scale={rdrData.scale}
            />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
});
