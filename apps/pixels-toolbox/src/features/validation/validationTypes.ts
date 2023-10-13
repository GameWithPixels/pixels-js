import {
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

export const ValidationSequences = [
  "firmwareUpdate",
  "boardNoCoil",
  "board",
  "die",
  "dieFinal",
] as const;

export type ValidationSequence = (typeof ValidationSequences)[number];

// Board types used for validation
export const ValidationBoardTypes: readonly PixelDieType[] = [
  "d6",
  "d6pipped",
  "d8",
  "d10",
  "d12",
  "d20",
];

// Die types used for validation
export const ValidationDieTypes: readonly PixelDieType[] = [
  "d4",
  "d6",
  "d6pipped",
  "d6fudge",
  "d8",
  "d10",
  "d00",
  "d12",
  "d20",
];

// Colorways used for validation
export const ValidationColorways: readonly PixelColorway[] = (
  Object.keys(PixelColorwayValues) as PixelColorway[]
).filter((c) => c !== "unknown" && c !== "custom");

export function getBoardOrDie(sequence: ValidationSequence): "board" | "die" {
  return sequence.startsWith("die") ? "die" : "board";
}

export function isBoard(sequence: ValidationSequence): boolean {
  return getBoardOrDie(sequence) === "board";
}

export function getSequenceIndex(sequence: ValidationSequence): number {
  return ValidationSequences.indexOf(sequence);
}
