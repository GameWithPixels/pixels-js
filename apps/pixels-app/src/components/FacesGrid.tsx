import {
  DiceUtils,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";

import { DieFaceButton } from "./buttons";

export function FacesGrid({
  dieType,
  selected,
  unavailable,
  onToggleFace,
  style,
  ...props
}: {
  dieType: PixelDieType;
  selected?: number[];
  unavailable?: number[];
  numColumns?: number;
  onToggleFace?: (face: number) => void;
} & ViewProps) {
  const faces = React.useMemo(() => DiceUtils.getDieFaces(dieType), [dieType]);
  const withPercent = Math.floor(100 / (props.numColumns ?? 5));
  return (
    <View
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          rowGap: 5,
        },
        style,
      ]}
      {...props}
    >
      {faces.map((f) => (
        <View
          key={f}
          style={{ width: `${withPercent}%`, alignItems: "center" }}
        >
          <DieFaceButton
            face={f}
            selected={selected?.includes(f)}
            disabled={unavailable?.includes(f)}
            style={{ width: "90%" }}
            onPress={() => onToggleFace?.(f)}
          />
        </View>
      ))}
    </View>
  );
}
