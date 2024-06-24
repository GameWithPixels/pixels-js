import { range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { PixelCard } from "./cards";

import { PairedDie } from "~/app/PairedDie";
import { DiceGrouping, groupAndSortDice, SortMode } from "~/features/profiles";

function isSelected(
  die: PairedDie,
  selection?: PairedDie | readonly PairedDie[]
): boolean {
  return Array.isArray(selection) ? selection.includes(die) : selection === die;
}

export interface DiceListProps {
  pairedDice: readonly PairedDie[];
  selection?: PairedDie | readonly PairedDie[];
  groupBy?: DiceGrouping;
  sortMode?: SortMode;
  onSelectDie?: (pairedDie: PairedDie) => void;
}

export function DiceList({
  pairedDice,
  selection,
  groupBy,
  sortMode,
  onSelectDie,
  style,
  ...props
}: DiceListProps & ViewProps) {
  const diceGroups = React.useMemo(
    () => groupAndSortDice(pairedDice, groupBy, sortMode),
    [pairedDice, groupBy, sortMode]
  );
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      {diceGroups.map(({ title, values: dice }, i) => (
        <View key={title + i} style={{ gap: 10 }}>
          <Text variant="headlineSmall">{title}</Text>
          {dice.map((d) => (
            // <View style={[{ gap: 20 }, style]} {...props}>
            <PixelCard
              key={d.systemId}
              pairedDie={d}
              selected={isSelected(d, selection)}
              onPress={() => onSelectDie?.(d)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function DiceColumn({
  pairedDice,
  selection,
  onSelectDie,
}: DiceListProps) {
  return (
    <View style={{ flex: 1, gap: 20 }}>
      {pairedDice.map((d) => (
        <PixelCard
          key={d.systemId}
          row
          pairedDie={d}
          selected={isSelected(d, selection)}
          onPress={() => onSelectDie?.(d)}
        />
      ))}
    </View>
  );
}

export function DiceGrid({
  pairedDice,
  selection,
  groupBy,
  sortMode,
  numColumns = 2,
  onSelectDie,
  style,
  ...props
}: {
  numColumns?: number;
  selected?: PairedDie;
} & DiceListProps &
  ViewProps) {
  const sortedDice = React.useMemo(
    () =>
      groupAndSortDice(pairedDice, groupBy, sortMode).flatMap((g) => g.values),
    [pairedDice, groupBy, sortMode]
  );
  return (
    <View
      style={[
        {
          flexDirection: "row",
          gap: 20,
        },
        style,
      ]}
      {...props}
    >
      {range(numColumns).map((col) => (
        <DiceColumn
          key={col}
          pairedDice={sortedDice.filter((_, i) => i % numColumns === col)}
          selection={selection}
          onSelectDie={onSelectDie}
        />
      ))}
    </View>
  );
}
