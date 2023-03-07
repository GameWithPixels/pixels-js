import { Box } from "native-base";
import React from "react";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

export interface HistogramProps {
  rolls: number[];
  viewRatio: number;
}

export const Histogram = React.memo(function ({ rolls }: HistogramProps) {
  const [size, setSize] = React.useState({ w: 100, h: 100 });
  const fontSize = 4;
  const numGradValues = 5;
  const gradCellWidth = 10;
  const barCellWidth = (size.w - gradCellWidth) / rolls.length;
  const barWidthRatio = 0.9;
  const barsMaxHeight = size.h - 6;
  return (
    <Box
      style={{ width: "100%", height: "100%" }}
      onLayout={(event) => {
        const l = event.nativeEvent.layout;
        setSize({ w: 100, h: (100 / l.width) * l.height });
      }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`}>
        {rolls.map((r, i) => {
          const h = (barsMaxHeight * r) / Math.max(...rolls);
          return (
            <Rect
              key={i}
              x={gradCellWidth + i * barCellWidth}
              y={barsMaxHeight - h}
              width={barCellWidth * barWidthRatio}
              height={h}
              fill="white"
            />
          );
        })}
        {rolls.map((_, i) => (
          <SvgText
            key={i}
            transform={`translate(${
              (i + 0.5 - (0.3 * fontSize) / barCellWidth) * barCellWidth +
              gradCellWidth
            },${size.h - 3}) rotate(90)`}
            fill="white"
            fontSize={fontSize}
            fontWeight="bold"
            textAnchor="middle"
          >
            {i + 1}
          </SvgText>
        ))}
        {[...Array(numGradValues).keys()].map((i) => (
          <SvgText
            key={i}
            x={gradCellWidth / 2}
            y={
              0.8 * fontSize +
              ((barsMaxHeight - 0.5 * fontSize) * i) / (numGradValues - 1)
            }
            fill="white"
            fontSize={fontSize}
            fontWeight="bold"
            textAnchor="middle"
          >
            {Math.round(
              (Math.max(...rolls) * (numGradValues - 1 - i)) /
                (numGradValues - 1)
            )}
          </SvgText>
        ))}
      </Svg>
    </Box>
  );
});
