import { range } from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { TouchableCard, TouchableCardProps } from "./TouchableCard";

import { useColorDesign } from "~/hooks";
import { DieRenderer } from "~/render3d/DieRenderer";

export function ColorDesignCard({
  design,
  dieType,
  style,
  ...props
}: {
  design: Profiles.ColorDesign;
  dieType: PixelDieType;
} & Omit<TouchableCardProps, "children">) {
  const { name } = useColorDesign(design);
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
        <DieRenderer dieType={dieType} colorway="hematiteGrey" />
      </View>
      <Text variant="titleMedium">{name}</Text>
      <Image
        contentFit="contain"
        style={{ flex: 1, width: "100%" }}
        source={require("#/temp/color-design.jpg")}
      />
    </TouchableCard>
  );
}

export interface ColorDesignListProps {
  designs: Profiles.ColorDesign[];
  selected?: Profiles.ColorDesign;
  onSelectDesign?: (design: Profiles.ColorDesign) => void;
}

function ColorDesignColumn({
  designs,
  selected,
  onSelectDesign,
}: ColorDesignListProps) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      {designs.map((d) => (
        <ColorDesignCard
          key={d.uuid}
          style={{ height: 180 }}
          design={d}
          dieType="d20"
          selected={d === selected}
          onPress={() => onSelectDesign?.(d)}
        />
      ))}
    </View>
  );
}

export function ColorDesignGrid({
  designs,
  numColumns = 2,
  selected,
  onSelectDesign,
}: {
  numColumns?: number;
} & ColorDesignListProps) {
  console.log("ColorDesignGrid", selected?.name);
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
          designs={designs.filter((_, i) => i % numColumns === col)}
          selected={selected}
          onSelectDesign={onSelectDesign}
        />
      ))}
    </View>
  );
}
