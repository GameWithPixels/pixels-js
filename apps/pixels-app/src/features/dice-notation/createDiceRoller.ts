import calculateFinalResult from "./calculateFinalResult";
import createRoll from "./roll";
import createRollDice from "./rollDice";
import constant from "./rules/constant";
import simpleDieRoll from "./rules/simpleDieRoll";
import type { Plugins } from "./rules/types";
import createTallyRolls from "./tallyRolls";
import createTokenize from "./tokenize";
import {
  getDefaultRollConfigOptions,
  RollConfigOptions,
} from "./util/rollConfig";

export const defaultPlugins = {
  [simpleDieRoll.typeConstant]: simpleDieRoll,
  [constant.typeConstant]: constant,
};

function createDiceRoller(
  plugins: Plugins = defaultPlugins,
  configOverrides: Partial<RollConfigOptions> = {}
) {
  const rollConfig = getDefaultRollConfigOptions(configOverrides);
  const { tokenize, tokenizeFaultTolerant } = createTokenize(
    plugins,
    rollConfig
  );
  const rollDice = createRollDice(plugins, rollConfig);
  const tallyRolls = createTallyRolls(plugins, rollConfig);

  return {
    tokenize,
    tokenizeFaultTolerant,
    calculateFinalResult,
    rollDice,
    tallyRolls,
    roll: createRoll(tokenize, rollDice, tallyRolls, rollConfig),
  };
}

export type DiceRoller = ReturnType<typeof createDiceRoller>;

export default createDiceRoller;
