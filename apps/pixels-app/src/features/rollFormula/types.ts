import { PixelDieTypeValues } from "@systemic-games/pixels-core-animation";
import { enumValue } from "@systemic-games/pixels-core-utils";

// The keys are compatible with PixelDieTypeValues.
export const RollDieTypeValues = (({
  d4,
  d6,
  d8,
  d10,
  d00,
  d12,
  d20,
  d6fudge,
}) => ({
  d4,
  d6,
  d8,
  d10,
  d00,
  d12,
  d20,
  d6fudge,
  d100: Object.values(PixelDieTypeValues).at(-1)! + 1,
}))(PixelDieTypeValues);

export type RollDieType = keyof typeof RollDieTypeValues;

export const RollOperatorValues = {
  "+": enumValue(),
  "-": enumValue(),
  "*": enumValue(),
  "/": enumValue(),
  ",": enumValue(),
} as const;

export type RollOperator = keyof typeof RollOperatorValues;

export const RollGroupingOperatorValues = {
  "(": enumValue(),
  ")": enumValue(),
  "{": enumValue(),
  "}": enumValue(),
} as const;

export type RollGroupingOperator = keyof typeof RollGroupingOperatorValues;

// https://wiki.roll20.net/Dice_Reference#Roll_Modifiers
export const RollModifierValues = {
  kh: enumValue(),
  kl: enumValue(),
  dh: enumValue(),
  dl: enumValue(),
} as const;

export type RollModifier = keyof typeof RollModifierValues;
