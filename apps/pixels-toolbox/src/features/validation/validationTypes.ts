import {
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { DiceSetType } from "~/features/set";

export const ValidationSequences = [
  "firmwareUpdate",
  "boardNoCoil",
  "board",
  "die",
  "dieFinalSingle",
  "dieFinalForSet",
  "dieReconfigure",
  "lccFinal",
] as const;

export type ValidationSequence = (typeof ValidationSequences)[number];

export type ValidationDeviceSelection =
  | { kind: "die"; dieType: PixelDieType }
  | { kind: "charger"; setType: DiceSetType; colorway: PixelColorway };

// Board types used for validation
export const ValidationBoardTypes: readonly PixelDieType[] = [
  "d6",
  "d6pipped",
  "d8",
  "d10",
  "d12",
  "d20",
] as const;

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
] as const;

// Dice colorways used for validation
export const ValidationColorways: readonly PixelColorway[] = (
  Object.keys(PixelColorwayValues) as PixelColorway[]
).filter((c) => c !== "unknown" && c !== "custom");

// Dice set types used for validation
export const ValidationDiceSetTypes: readonly DiceSetType[] = [
  "rpg",
  "advantage",
  "boardGamer",
  "power",
  "fudge",
  "classicPippedD6",
  "initiativeD20",
  "rageD12",
  "divineD00",
  "eldritchD10",
  "smiteD8",
  "fireballD6",
  "healingD4",
] as const;

// Set colorways used for validation
export const ValidationSetColorways: readonly PixelColorway[] =
  ValidationColorways.filter((c) => c !== "whiteAurora");

export function getBoardOrDie(sequence: ValidationSequence): "board" | "die" {
  return sequence.startsWith("die") ? "die" : "board";
}

export function isBoard(sequence: ValidationSequence): boolean {
  return getBoardOrDie(sequence) === "board";
}

export function getSequenceIndex(sequence: ValidationSequence): number {
  return ValidationSequences.indexOf(sequence);
}
