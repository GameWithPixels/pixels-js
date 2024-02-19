import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { SortButton, SortMode } from "./buttons";
import { ColorDesignGrid } from "./designs";

import { usePatternsList } from "~/hooks";

export function ColorDesignPicker({
  pattern,
  onSelectPattern,
  ...props
}: {
  pattern?: Readonly<Profiles.Pattern>;
  onSelectPattern?: (pattern: Readonly<Profiles.Pattern>) => void;
} & ViewProps) {
  const patterns = usePatternsList();
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
        selected={pattern}
        onSelectDesign={onSelectPattern}
        patterns={patterns}
      />
    </View>
  );
}
