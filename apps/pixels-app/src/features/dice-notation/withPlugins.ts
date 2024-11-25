import { defaultPlugins } from "./createDiceRoller";
import type { Plugins, DiceRule } from "./rules/types";

function withPlugins(...plugins: DiceRule<any>[]): Plugins {
  const customPlugins: Plugins = {};
  plugins.forEach((plugin) => {
    customPlugins[plugin.typeConstant] = plugin;
  });

  // order matters, more specific rules must be dumped in _first_
  const allPlugins: Plugins = { ...customPlugins, ...defaultPlugins };

  return allPlugins;
}

export default withPlugins;
