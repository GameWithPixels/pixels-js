import { DiceRule } from "./types";

export const KEEP_HIGHEST_ROLL = "_KeepHighestRoll";

export interface KeepHighestRollToken {
  count: number;
  numSides: number;
  keep: number;
}

const keepHighestRoll: DiceRule<KeepHighestRollToken> = {
  regex: /\d+d\d+kh\d*/,
  typeConstant: KEEP_HIGHEST_ROLL,
  tokenize: (raw) => {
    const [dice, keep] = raw.split("kh");
    const [count, numSides] = dice.split("d").map((num) => parseInt(num, 10));
    return { count, numSides, keep: keep ? parseInt(keep, 10) : 1 };
  },
  roll: ({ count, numSides }, { generateRolls }) =>
    generateRolls(count, numSides),
  calculateValue: (token, rolls) =>
    rolls
      .sort((a, b) => b - a)
      .slice(0, token.keep)
      .reduce((agg, num) => agg + num, 0),
};

export default keepHighestRoll;
