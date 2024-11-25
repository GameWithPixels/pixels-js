import { DiceRule } from "./types";

export const CONSTANT = "_Constant";

const constant: DiceRule<number> = {
  regex: /\d+/,
  typeConstant: CONSTANT,
  tokenize: (raw) => parseInt(raw, 10),
  roll: () => [],
  calculateValue: (token) => token,
};

export default constant;
