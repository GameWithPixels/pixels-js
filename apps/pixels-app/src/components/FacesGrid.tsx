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
  return (
    <View
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          rowGap: 10,
        },
        style,
      ]}
      {...props}
    >
      {faces.map((f) => (
        <View key={f} style={{ width: "25%", alignItems: "center" }}>
          <DieFaceButton
            face={f}
            selected={selected?.includes(f)}
            disabled={unavailable?.includes(f)}
            onPress={() => onToggleFace?.(f)}
          />
        </View>
      ))}
    </View>
  );
}
