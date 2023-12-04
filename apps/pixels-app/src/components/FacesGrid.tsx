import React from "react";
import { View, ViewProps } from "react-native";

import { DieFaceButton } from "./buttons";

export function FacesGrid({
  faces,
  selected,
  onToggleFace,
  style,
  ...props
}: {
  faces: number[];
  numColumns?: number;
  selected?: number[];
  onToggleFace?: (face: number) => void;
} & ViewProps) {
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
            inUse={f % 4 === 0}
            onPress={() => onToggleFace?.(f)}
          />
        </View>
      ))}
    </View>
  );
}
