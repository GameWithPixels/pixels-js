import calculateFinalResult from "./calculateFinalResult";
import createRollDice from "./rollDice";
import { RollResults } from "./rules/types";
import createTallyRolls, { RollTotal } from "./tallyRolls";
import { Tokenize } from "./tokenize";
import { Token } from "./tokens";
import { RollConfigOptions } from "./util/rollConfig";

export interface RollInformation {
  tokens: Token[];
  rolls: RollResults;
  rollTotals: RollTotal[];
  result: number;
}

function createRoll(
  tokenize: Tokenize,
  rollDice: ReturnType<typeof createRollDice>,
  tallyRolls: ReturnType<typeof createTallyRolls>,
  rollConfig: RollConfigOptions
) {
  function roll(
    notation: string,
    configOverrides?: Partial<RollConfigOptions>
  ): RollInformation {
    const finalOverrides = { ...rollConfig, ...configOverrides };
    const tokens = tokenize(notation, finalOverrides);
    const rolls = rollDice(tokens, finalOverrides);
    const rollTotals = tallyRolls(tokens, rolls, finalOverrides);
    const result = calculateFinalResult(tokens, rollTotals);
    return {
      tokens,
      rolls,
      rollTotals,
      result,
    };
  }

  return roll;
}

export default createRoll;
