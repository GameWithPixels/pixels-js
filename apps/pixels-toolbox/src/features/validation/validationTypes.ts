import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { DiceSetType } from "./DiceSetType";

export const ValidationSequences = [
  "firmwareUpdate",
  "boardNoCoil",
  "board",
  "die",
  "dieFinalSingle",
  "dieFinalForSet",
  "dieReconfigure",
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

export function getDiceSetDice(type: DiceSetType): PixelDieType[] {
  switch (type) {
    case "unknown":
      return [];
    case "rpg":
      return ["d20", "d12", "d00", "d10", "d8", "d6", "d4"];
    case "advantage":
      return ["d20", "d20", "d12", "d10", "d8", "d6", "d4"];
    case "boardGamer":
      return ["d20", "d12", "d10", "d8", "d6pipped", "d6pipped", "d4"];
    case "power":
      return ["d20", "d8", "d8", "d8", "d6", "d6", "d6"];
    case "fudge":
      return [
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
      ];
    case "classicPippedD6":
      return [
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
      ];
    case "initiativeD20":
      return ["d20", "d20", "d20", "d20", "d20", "d20", "d20"];
    case "rageD12":
      return ["d12", "d12", "d12", "d12", "d12", "d12", "d12"];
    case "divineD00":
      return ["d00", "d00", "d00", "d00", "d00", "d00", "d00"];
    case "eldritchD10":
      return ["d10", "d10", "d10", "d10", "d10", "d10", "d10"];
    case "smiteD8":
      return ["d8", "d8", "d8", "d8", "d8", "d8", "d8"];
    case "fireballD6":
      return ["d6", "d6", "d6", "d6", "d6", "d6", "d6"];
    case "healingD4":
      return ["d4", "d4", "d4", "d4", "d4", "d4", "d4"];
    default:
      assertNever(type);
  }
}
