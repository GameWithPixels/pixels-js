import { range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { TouchableCard, TouchableCardProps } from "./TouchableCard";

import { AudioClipAsset } from "~/features/store/libraryAssets";

export function AudioClipCard({
  name,
  ...props
}: { name: string } & Omit<TouchableCardProps, "children">) {
  return (
    <TouchableCard {...props}>
      <Text>{name}</Text>
    </TouchableCard>
  );
}
function AudioClipsColumn({
  clips,
  selected,
  onSelectClip,
  style,
  ...props
}: ClipsListProps) {
  return (
    <View key="anim-column" style={[{ flex: 1, gap: 10 }, style]} {...props}>
      {clips.map((c) => (
        <AudioClipCard
          key={c.uuid}
          name={c.name}
          selected={c.uuid === selected}
          onPress={() => onSelectClip?.(c.uuid)}
        />
      ))}
    </View>
  );
}

export interface ClipsListProps extends ViewProps {
  clips: AudioClipAsset[];
  selected?: string;
  onSelectClip?: (clipUuid: string) => void;
}

export function AudioClipsGrid({
  clips,
  numColumns = 2,
  selected,
  onSelectClip,
  style,
  ...props
}: {
  numColumns?: number;
} & ClipsListProps) {
  return (
    <View style={[{ flexDirection: "row", gap: 10 }, style]} {...props}>
      {range(numColumns).map((col) => (
        <AudioClipsColumn
          key={col}
          clips={clips.filter((_, i) => i % numColumns === col)}
          selected={selected}
          onSelectClip={onSelectClip}
        />
      ))}
    </View>
  );
}
