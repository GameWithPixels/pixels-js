import { MaterialCommunityIcons } from "@expo/vector-icons";
import { range } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { TouchableCard, TouchableCardProps } from "./TouchableCard";

import { useAppSelector } from "~/app/hooks";
import { playActionAudioClip } from "~/features/appActions";
import { FileAsset } from "~/features/store/libraryAssets";

export function AudioClipCard({
  name,
  fileType,
  clipUuid,
  ...props
}: { name: string; fileType: string; clipUuid: string } & Omit<
  TouchableCardProps,
  "children" | "contentStyle"
>) {
  const { colors } = useTheme();
  const audioClips = useAppSelector(
    (state) => state.libraryAssets.audioClips.entities
  );
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
      <MaterialCommunityIcons
        name="play-circle-outline"
        size={30}
        color={colors.onSurface}
        style={{ position: "absolute", top: 0, right: 0, padding: 5 }}
        onPress={() =>
          playActionAudioClip(
            new Profiles.ActionPlayAudioClip({ clipUuid }),
            audioClips
          )
        }
      />
    </TouchableCard>
  );
}

function AudioClipsColumn({
  clips,
  selected,
  onPressClip,
  onLongPressClip,
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
          clipUuid={c.uuid}
          selected={c.uuid === selected}
          onPress={() => onPressClip?.(c.uuid)}
          onLongPress={() => onLongPressClip?.(c.uuid)}
        />
      ))}
    </View>
  );
}

export interface ClipsListProps extends ViewProps {
  clips: FileAsset[];
  selected?: string;
  onPressClip?: (clipUuid: string) => void;
  onLongPressClip?: (clipUuid: string) => void;
}

export function AudioClipsGrid({
  clips,
  numColumns = 2,
  selected,
  onPressClip,
  onLongPressClip,
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
          onPressClip={onPressClip}
          onLongPressClip={onLongPressClip}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardText: { width: "100%", textAlign: "center" },
});
