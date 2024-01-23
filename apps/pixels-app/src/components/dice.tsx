import { range } from "@systemic-games/pixels-core-utils";
import { View, ViewProps } from "react-native";

import { AddDieButton } from "./buttons";
import { PixelHCard, PixelVCard } from "./cards";

import { PairedPixel } from "~/features/dice/PairedPixel";

function isSelected(
  pixel: PairedPixel,
  selection?: PairedPixel | readonly PairedPixel[]
): boolean {
  return Array.isArray(selection)
    ? selection.includes(pixel)
    : selection === pixel;
}

function isPreviousItemSelected(
  pixel: PairedPixel,
  pixels: readonly PairedPixel[],
  selection?: PairedPixel | readonly PairedPixel[]
): boolean {
  if (!Array.isArray(selection)) {
    return false;
  }
  const prev = pixels[pixels.indexOf(pixel) - 1];
  return !!prev && selection.includes(prev);
}

function isNextItemSelected(
  pixel: PairedPixel,
  pixels: readonly PairedPixel[],
  selection?: PairedPixel | readonly PairedPixel[]
): boolean {
  if (!Array.isArray(selection)) {
    return false;
  }
  const prev = pixels[pixels.indexOf(pixel) + 1];
  return !!prev && selection.includes(prev);
}

export interface DiceListProps {
  pixels: readonly PairedPixel[];
  selection?: PairedPixel | readonly PairedPixel[];
  onSelectDie?: (pixel: PairedPixel) => void;
  onPressNewDie?: () => void;
}

export function DiceList({
  pixels,
  selection,
  onSelectDie,
  onPressNewDie,
  ...props
}: DiceListProps & ViewProps) {
  return (
    <View {...props}>
      {pixels.map((p, i) => {
        const selected = isSelected(p, selection);
        const prevSelected = isPreviousItemSelected(p, pixels, selection);
        const nextSelected = isNextItemSelected(p, pixels, selection);
        return (
          <PixelHCard
            key={p.systemId}
            noTopBorder={i > 0 && (!selected || prevSelected)}
            noBottomBorder={!selected && nextSelected}
            squaredTopBorder={i > 0}
            squaredBottomBorder={i < pixels.length - 1}
            pairedPixel={p}
            selected={selected}
            onPress={() => onSelectDie?.(p)}
          />
        );
      })}
      {onPressNewDie && (
        <AddDieButton
          sentry-label="new-die-from-list"
          style={{ marginTop: pixels.length ? 20 : 0 }}
          onPress={onPressNewDie}
        />
      )}
    </View>
  );
}

export function DiceColumn({
  pixels,
  miniCards,
  selection,
  onSelectDie,
  onPressNewDie,
}: {
  miniCards?: boolean;
} & DiceListProps) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      {pixels.map((p) => (
        <PixelVCard
          key={p.systemId}
          pairedPixel={p}
          miniCards={miniCards}
          selected={isSelected(p, selection)}
          onPress={() => onSelectDie?.(p)}
        />
      ))}
      {onPressNewDie && (
        <AddDieButton
          sentry-label="new-die-from-column"
          contentStyle={{ aspectRatio: 1 }}
          onPress={onPressNewDie}
        />
      )}
    </View>
  );
}

export function DiceGrid({
  pixels,
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
  selected?: PairedPixel;
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
          pixels={pixels.filter((_, i) => i % numColumns === col)}
          miniCards={miniCards}
          selection={selection}
          onSelectDie={onSelectDie}
          onPressNewDie={
            col === pixels.length % numColumns ? onPressNewDie : undefined
          }
        />
      ))}
    </View>
  );
}
