import { range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { TouchableCard, TouchableCardProps } from "./TouchableCard";
import { AppActionKindIcon } from "./icons";

import { useAppSelector } from "~/app/hooks";

export function AppActionCard({
  appActionUuid,
  ...props
}: { appActionUuid: string } & Omit<
  TouchableCardProps,
  "children" | "contentStyle"
>) {
  const action = useAppSelector(
    (state) => state.appActions.entries.entities[appActionUuid]
  );
  const { colors } = useTheme();
  return (
    action && (
      <TouchableCard contentStyle={{ paddingVertical: 20 }} {...props}>
        <View style={{ alignItems: "center", gap: 20 }}>
          <AppActionKindIcon
            actionKind={action.kind}
            size={48}
            color={colors.onSurface}
          />
          <Text variant="titleMedium" numberOfLines={1} style={styles.cardText}>
            {appActionUuid}
          </Text>
        </View>
        <Text variant="bodySmall" numberOfLines={1} style={styles.cardText}>
          Kind: {action.kind}
        </Text>
      </TouchableCard>
    )
  );
}

function AppActionsColumn({
  appActionUuids,
  selected,
  onPressAppAction,
  onLongPressAppAction,
  style,
  ...props
}: ClipsListProps) {
  return (
    <View key="anim-column" style={[{ flex: 1, gap: 10 }, style]} {...props}>
      {appActionUuids.map((uuid) => (
        <AppActionCard
          key={uuid}
          appActionUuid={uuid}
          selected={uuid === selected}
          onPress={() => onPressAppAction?.(uuid)}
          onLongPress={() => onLongPressAppAction?.(uuid)}
        />
      ))}
    </View>
  );
}

export interface ClipsListProps extends ViewProps {
  appActionUuids: string[];
  selected?: string;
  onPressAppAction?: (uuid: string) => void;
  onLongPressAppAction?: (uuid: string) => void;
}

export function AppActionsGrid({
  appActionUuids,
  numColumns = 2,
  selected,
  onPressAppAction,
  onLongPressAppAction,
  style,
  ...props
}: {
  numColumns?: number;
} & ClipsListProps) {
  return (
    <View style={[{ flexDirection: "row", gap: 10 }, style]} {...props}>
      {range(numColumns).map((col) => (
        <AppActionsColumn
          key={col}
          appActionUuids={appActionUuids.filter(
            (_, i) => i % numColumns === col
          )}
          selected={selected}
          onPressAppAction={onPressAppAction}
          onLongPressAppAction={onLongPressAppAction}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardText: { width: "100%", textAlign: "center" },
});
