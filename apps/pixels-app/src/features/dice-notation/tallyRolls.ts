import { Plugins, RollResults } from "./rules/types";
import { Token, CoreTokenTypes } from "./tokens";
import isNil from "./util/isNill";
import { getFinalRollConfig, RollConfigOptions } from "./util/rollConfig";

export type RollTotal = number | null;

function createTallyRolls(plugins: Plugins, config: RollConfigOptions) {
  function tallyRolls(
    tokens: Token[],
    rolls: RollResults,
    configOverrides?: Partial<RollConfigOptions>
  ): RollTotal[] {
    const finalConfig = getFinalRollConfig(config, configOverrides);
    return tokens.map((token, index) => {
      switch (token.type) {
        case CoreTokenTypes.CloseParen:
        case CoreTokenTypes.OpenParen:
        case CoreTokenTypes.Operator:
          if (rolls[index])
            throw new Error(
              `Roll result array does not match provided tokens. Got results but expected null at position ${index}`
            );
          return null;
        case CoreTokenTypes.DiceRoll: {
          const rollsForToken = rolls[index];
          if (isNil(rollsForToken))
            throw new Error(
              `Roll result array does not match provided tokens. Got null but expected results at position ${index}`
            );
          return plugins[token.detailType].calculateValue(
            token.detail,
            rollsForToken,
            finalConfig
          );
        }
      }
    });
  }

  return tallyRolls;
}

export default createTallyRolls;
