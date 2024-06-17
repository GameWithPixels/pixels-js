import { range } from "@systemic-games/pixels-core-utils";
import { View, ViewProps } from "react-native";

import { PixelHCard, PixelVCard } from "./cards";

import { PairedDie } from "~/app/PairedDie";

function isSelected(
  die: PairedDie,
  selection?: PairedDie | readonly PairedDie[]
): boolean {
  return Array.isArray(selection) ? selection.includes(die) : selection === die;
}

export interface DiceListProps {
  dice: readonly PairedDie[];
  selection?: PairedDie | readonly PairedDie[];
  onSelectDie?: (pairedDie: PairedDie) => void;
}

export function DiceList({
  dice,
  selection,
  onSelectDie,
  style,
  ...props
}: DiceListProps & ViewProps) {
  return (
    <View style={[{ gap: 20 }, style]} {...props}>
      {dice.map((p) => (
        <PixelHCard
          key={p.systemId}
          pairedDie={p}
          selected={isSelected(p, selection)}
          onPress={() => onSelectDie?.(p)}
        />
      ))}
    </View>
  );
}

export function DiceColumn({ dice, selection, onSelectDie }: DiceListProps) {
  return (
    <View style={{ flex: 1, gap: 30 }}>
      {dice.map((p) => (
        <PixelVCard
          key={p.systemId}
          pairedDie={p}
          selected={isSelected(p, selection)}
          onPress={() => onSelectDie?.(p)}
        />
      ))}
    </View>
  );
}

export function DiceGrid({
  dice,
  numColumns = 2,
  selection,
  onSelectDie,
  style,
  ...props
}: {
  numColumns?: number;
  selected?: PairedDie;
} & DiceListProps &
  ViewProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          gap: 30,
        },
        style,
      ]}
      {...props}
    >
      {range(numColumns).map((col) => (
        <DiceColumn
          key={col}
          dice={dice.filter((_, i) => i % numColumns === col)}
          selection={selection}
          onSelectDie={onSelectDie}
        />
      ))}
    </View>
  );
}
