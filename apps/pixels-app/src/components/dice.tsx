import { range } from "@systemic-games/pixels-core-utils";
import { View, ViewProps } from "react-native";

import { AddDieButton } from "./buttons";
import { PixelHCard, PixelVCard } from "./cards";

import { PairedDie } from "~/app/PairedDie";

function isSelected(
  die: PairedDie,
  selection?: PairedDie | readonly PairedDie[]
): boolean {
  return Array.isArray(selection) ? selection.includes(die) : selection === die;
}

function isPreviousItemSelected(
  die: PairedDie,
  dice: readonly PairedDie[],
  selection?: PairedDie | readonly PairedDie[]
): boolean {
  if (!Array.isArray(selection)) {
    return false;
  }
  const prev = dice[dice.indexOf(die) - 1];
  return !!prev && selection.includes(prev);
}

function isNextItemSelected(
  die: PairedDie,
  dice: readonly PairedDie[],
  selection?: PairedDie | readonly PairedDie[]
): boolean {
  if (!Array.isArray(selection)) {
    return false;
  }
  const prev = dice[dice.indexOf(die) + 1];
  return !!prev && selection.includes(prev);
}

export interface DiceListProps {
  dice: readonly PairedDie[];
  selection?: PairedDie | readonly PairedDie[];
  onSelectDie?: (pairedDie: PairedDie) => void;
  onPressNewDie?: () => void;
}

export function DiceList({
  dice,
  selection,
  onSelectDie,
  onPressNewDie,
  ...props
}: DiceListProps & ViewProps) {
  return (
    <View {...props}>
      {dice.map((p, i) => {
        const selected = isSelected(p, selection);
        const prevSelected = isPreviousItemSelected(p, dice, selection);
        const nextSelected = isNextItemSelected(p, dice, selection);
        return (
          <PixelHCard
            key={p.systemId}
            noTopBorder={i > 0 && (!selected || prevSelected)}
            noBottomBorder={!selected && nextSelected}
            squaredTopBorder={i > 0}
            squaredBottomBorder={i < dice.length - 1}
            pairedDie={p}
            selected={selected}
            onPress={() => onSelectDie?.(p)}
          />
        );
      })}
      {onPressNewDie && (
        <AddDieButton
          sentry-label="new-die-from-list"
          style={{ marginTop: dice.length ? 20 : 0 }}
          onPress={onPressNewDie}
        />
      )}
    </View>
  );
}

export function DiceColumn({
  dice,
  miniCards,
  selection,
  onSelectDie,
  onPressNewDie,
}: {
  miniCards?: boolean;
} & DiceListProps) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      {dice.map((p) => (
        <PixelVCard
          key={p.systemId}
          pairedDie={p}
          miniCards={miniCards}
          selected={isSelected(p, selection)}
          onPress={() => onSelectDie?.(p)}
        />
      ))}
      {onPressNewDie && (
        <AddDieButton
          sentry-label="new-die-from-column"
          iconSize={miniCards ? 40 : undefined}
          contentStyle={{ aspectRatio: 1 }}
          onPress={onPressNewDie}
        />
      )}
    </View>
  );
}

export function DiceGrid({
  dice,
  numColumns = 2,
  miniCards,
  selection,
  onSelectDie,
  onPressNewDie,
  style,
  ...props
}: {
  numColumns?: number;
  miniCards?: boolean;
  selected?: PairedDie;
} & DiceListProps &
  ViewProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          gap: 10,
        },
        style,
      ]}
      {...props}
    >
      {range(numColumns).map((col) => (
        <DiceColumn
          key={col}
          dice={dice.filter((_, i) => i % numColumns === col)}
          miniCards={miniCards}
          selection={selection}
          onSelectDie={onSelectDie}
          onPressNewDie={
            col === dice.length % numColumns ? onPressNewDie : undefined
          }
        />
      ))}
    </View>
  );
}
