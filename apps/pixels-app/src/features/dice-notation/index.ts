import createDiceRoller from "./createDiceRoller";

export { default as createDiceRoller } from "./createDiceRoller";
export { default as withPlugins } from "./withPlugins";
export { default as random } from "./util/random";

export type { DiceRoller } from "./createDiceRoller";
export type { Random } from "./util/random";
export type { Plugins, DiceRule, Rolls, RollResults } from "./rules/types";
export type { SimpleDiceRollToken } from "./rules/simpleDieRoll";
export type { KeepHighestRollToken } from "./rules/keepHighestRoll";
export type { KeepLowestRollToken } from "./rules/keepLowestRoll";
export type {
  BaseToken,
  OpenParenToken,
  CloseParenToken,
  OperatorToken,
  DiceRollToken,
  Token,
  ErrorToken,
} from "./tokens";

export const {
  tokenize,
  tokenizeFaultTolerant,
  calculateFinalResult,
  rollDice,
  tallyRolls,
  roll,
} = createDiceRoller();
