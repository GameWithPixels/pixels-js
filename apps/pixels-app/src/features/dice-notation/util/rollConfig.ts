import createGenerateRolls from "./generateRolls";
import defaultRandom, { Random } from "./random";

export interface RollConfig {
  random: Random;
  generateRolls: (numDice: number, diceSize: number) => number[];
  context: Record<string, any>;
}

export interface RollConfigOptions {
  random: Random;
  context: Record<string, any>;
  maxRandomRolls: number | "unlimited_rolls_not_recommended";
}

export const getDefaultRollConfigOptions = (
  helpers: Partial<RollConfigOptions> = {}
): RollConfigOptions => {
  const {
    random = defaultRandom,
    context = {},
    maxRandomRolls = 100_000,
  } = helpers;
  return {
    random,
    context,
    maxRandomRolls,
  };
};

const wrapRandomToPreventCrashes = (config: RollConfigOptions): Random => {
  const { maxRandomRolls, random } = config;

  // Don't wrap if limitation is disabled
  if (maxRandomRolls === "unlimited_rolls_not_recommended") return random;

  let rollCount = 0;
  return (min, max) => {
    rollCount++;
    if (rollCount > maxRandomRolls)
      throw new Error(`Cannot roll more than ${maxRandomRolls} dice`);
    return random(min, max);
  };
};

export const getFinalRollConfig = (
  config: RollConfigOptions,
  overrides: Partial<RollConfigOptions> = {}
): RollConfig => {
  const finalConfig = {
    ...config,
    ...overrides,
  };
  const random = wrapRandomToPreventCrashes(finalConfig);
  return {
    ...finalConfig,
    random,
    generateRolls: createGenerateRolls(random),
  };
};
