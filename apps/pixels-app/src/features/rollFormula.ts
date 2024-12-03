import {
  DiceUtils,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import {
  calculateFinalResult,
  RollResults,
  tallyRolls,
  Token,
} from "./dice-notation";
import { defaultPlugins } from "./dice-notation/createDiceRoller";
import { KEEP_HIGHEST_ROLL } from "./dice-notation/rules/keepHighestRoll";
import { KEEP_LOWEST_ROLL } from "./dice-notation/rules/keepLowestRoll";
import { SIMPLE_DIE_ROLL } from "./dice-notation/rules/simpleDieRoll";
import { CoreTokenTypes } from "./dice-notation/tokens";
import {
  getDefaultRollConfigOptions,
  getFinalRollConfig,
} from "./dice-notation/util/rollConfig";

type ExpectedRolls = (PixelDieType | number)[] | null;

export function getExpectedRolls(tokens: Token[]): ExpectedRolls[] {
  const rollConfig = getFinalRollConfig(getDefaultRollConfigOptions());
  const plugins = defaultPlugins;
  return tokens.map((token) =>
    token.type !== CoreTokenTypes.DiceRoll
      ? null
      : token.detailType !== SIMPLE_DIE_ROLL &&
          token.detailType !== KEEP_HIGHEST_ROLL &&
          token.detailType !== KEEP_LOWEST_ROLL
        ? plugins[token.detailType].roll(token.detail, rollConfig)
        : // Overriding the roll function to estimate the die type
          Array(token.detail.count).fill(
            DiceUtils.estimateDieType(token.detail.numSides)
          )
  );
}

export function getRollsResults(
  expectedDiceRolls: readonly ExpectedRolls[],
  rolls: readonly Readonly<{ dieType: PixelDieType; value: number }>[]
): RollResults {
  const results: RollResults = [];
  const availableRolls = [...rolls];
  for (const arr of expectedDiceRolls) {
    if (arr) {
      const rolls: number[] = [];
      results.push(rolls);
      for (const dieType of arr) {
        if (typeof dieType === "string") {
          const index = availableRolls.findIndex(
            (r) =>
              DiceUtils.getFaceCount(r.dieType) ===
              DiceUtils.getFaceCount(dieType)
          );
          if (index >= 0) {
            rolls.push(availableRolls[index].value);
            availableRolls.splice(index, 1);
          } else {
            rolls.push(-1);
          }
        } else {
          rolls.push(dieType);
        }
      }
    } else {
      results.push(arr);
    }
  }
  return results;
}

export function computeRollsResult(
  tokens: Token[],
  partialRolls: RollResults
): number {
  const rollConfig = getFinalRollConfig(getDefaultRollConfigOptions());
  const rolls = [];
  for (const arr of partialRolls) {
    if (arr) {
      const finalArr: number[] = [];
      rolls.push(finalArr);
      for (const value of arr) {
        // Value is -1 for missing rolls
        finalArr.push(Math.max(0, value));
      }
    } else {
      rolls.push(arr);
    }
  }
  const rollTotals = tallyRolls(tokens, rolls, rollConfig);
  const result = calculateFinalResult(tokens, rollTotals);
  return result;
}
