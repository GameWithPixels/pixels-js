import { range } from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { DieRendererWithFocus } from "./DieRendererWithFocus";
import { TouchableCard, TouchableCardProps } from "./TouchableCard";

export function ColorDesignCard({
  pattern,
  dieType,
  style,
  ...props
}: {
  pattern: Readonly<Profiles.Pattern>;
  dieType: PixelDieType;
} & Omit<TouchableCardProps, "children">) {
  return (
    <TouchableCard
      contentStyle={[
        {
          alignItems: "center",
          paddingVertical: 0,
        },
        style,
      ]}
      {...props}
    >
      <View style={{ width: 100, aspectRatio: 1 }}>
        <DieRendererWithFocus dieType={dieType} colorway="hematiteGrey" />
      </View>
      <Text variant="titleMedium">{pattern.name}</Text>
      <Image
        contentFit="contain"
        style={{ flex: 1, width: "100%" }}
        source={require("#/temp/color-design.jpg")}
      />
    </TouchableCard>
  );
}

export interface ColorDesignListProps {
  patterns: Readonly<Profiles.Pattern>[];
  selected?: Readonly<Profiles.Pattern>;
  onSelectDesign?: (design: Readonly<Profiles.Pattern>) => void;
}

function ColorDesignColumn({
  patterns,
  selected,
  onSelectDesign,
}: ColorDesignListProps) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      {patterns.map((d) => (
        <ColorDesignCard
          key={d.uuid}
          pattern={d}
          dieType="d20"
          style={{ height: 180 }}
          selected={d === selected}
          onPress={() => onSelectDesign?.(d)}
        />
      ))}
    </View>
  );
}

export function ColorDesignGrid({
  patterns,
  numColumns = 2,
  selected,
  onSelectDesign,
}: {
  numColumns?: number;
} & ColorDesignListProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
      }}
    >
      {range(numColumns).map((col) => (
        <ColorDesignColumn
          key={col}
          patterns={patterns.filter((_, i) => i % numColumns === col)}
          selected={selected}
          onSelectDesign={onSelectDesign}
        />
      ))}
    </View>
  );
}
