import { MaterialCommunityIcons } from "@expo/vector-icons";
import { range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { TouchableCard, TouchableCardProps } from "./TouchableCard";

import { AudioClipAsset } from "~/features/store/libraryAssets";

export function AudioClipCard({
  name,
  fileType,
  ...props
}: { name: string; fileType: string } & Omit<
  TouchableCardProps,
  "children" | "contentStyle"
>) {
  const { colors } = useTheme();
  return (
    <TouchableCard contentStyle={{ paddingVertical: 20 }} {...props}>
      <View style={{ alignItems: "center", gap: 20 }}>
        <MaterialCommunityIcons
          name="waveform"
          size={48}
          color={colors.onSurface}
        />
        <Text variant="titleMedium" numberOfLines={1} style={styles.cardText}>
          {name}
        </Text>
      </View>
      <Text variant="bodySmall" numberOfLines={1} style={styles.cardText}>
        ({fileType})
      </Text>
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
          fileType={c.type}
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

const styles = StyleSheet.create({
  cardText: { width: "100%", textAlign: "center" },
});
