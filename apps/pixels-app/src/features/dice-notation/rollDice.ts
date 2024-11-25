import { Plugins, RollResults } from "./rules/types";
import { CoreTokenTypes, Token } from "./tokens";
import { getFinalRollConfig, RollConfigOptions } from "./util/rollConfig";

function createRollDice(plugins: Plugins, config: RollConfigOptions) {
  function rollDice(
    tokens: Token[],
    configOverrides?: Partial<RollConfigOptions>
  ): RollResults {
    const finalConfig = getFinalRollConfig(config, configOverrides);
    return tokens.map((token) => {
      switch (token.type) {
        case CoreTokenTypes.CloseParen:
        case CoreTokenTypes.OpenParen:
        case CoreTokenTypes.Operator:
          return null;
        case CoreTokenTypes.DiceRoll:
          return plugins[token.detailType].roll(token.detail, finalConfig);
      }
    });
  }

  return rollDice;
}

export default createRollDice;
