import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { SortButton, SortMode } from "./buttons";
import { ColorDesignGrid } from "./designs";

import { usePatterns } from "~/hooks";

export function ColorDesignPicker({
  colorDesign,
  onSelectDesign,
  ...props
}: {
  colorDesign?: Profiles.Pattern;
  onSelectDesign?: (colorDesign: Profiles.Pattern) => void;
} & ViewProps) {
  const { patterns } = usePatterns();
  const [sortMode, setSortMode] = React.useState<SortMode>("a-z");
  return (
    <View {...props}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <Text variant="titleLarge">Color Designs</Text>
        <SortButton mode={sortMode} onChange={setSortMode} />
      </View>
      <ColorDesignGrid
        selected={colorDesign}
        onSelectDesign={onSelectDesign}
        patterns={patterns}
      />
    </View>
  );
}
