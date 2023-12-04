import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { SortButton, SortMode } from "./buttons";
import { ColorDesignGrid } from "./designs";

import { useColorDesigns } from "@/hooks/useColorDesigns";
import { ColorDesign } from "@/temp";

export function ColorDesignPicker({
  colorDesign,
  onSelectDesign,
  ...props
}: {
  colorDesign?: ColorDesign;
  onSelectDesign?: (colorDesign: ColorDesign) => void;
} & ViewProps) {
  const { colorDesigns } = useColorDesigns();
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
        designs={colorDesigns}
      />
    </View>
  );
}
