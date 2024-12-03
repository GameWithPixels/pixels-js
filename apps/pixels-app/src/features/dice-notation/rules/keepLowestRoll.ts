import { DiceRule } from "./types";

export const KEEP_LOWEST_ROLL = "_KeepLowestRoll";

export interface KeepLowestRollToken {
  count: number;
  numSides: number;
  keep: number;
}

const keepLowestRoll: DiceRule<KeepLowestRollToken> = {
  regex: /\d+d\d+kl\d*/,
  typeConstant: KEEP_LOWEST_ROLL,
  tokenize: (raw) => {
    const [dice, keep] = raw.split("kl");
    const [count, numSides] = dice.split("d").map((num) => parseInt(num, 10));
    return { count, numSides, keep: keep ? parseInt(keep, 10) : 1 };
  },
  roll: ({ count, numSides }, { generateRolls }) =>
    generateRolls(count, numSides),
  calculateValue: (token, rolls) =>
    rolls
      .sort((a, b) => a - b)
      .slice(0, token.keep)
      .reduce((agg, num) => agg + num, 0),
};

export default keepLowestRoll;
