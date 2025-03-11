import { PixelDieType } from "@systemic-games/pixels-core-animation";
import { assertNever, range } from "@systemic-games/pixels-core-utils";

import { RollFormulaElement, RollFormulaTree } from "./rollFormula";
import { RollOperator, RollDieType, RollModifier } from "./types";

type DieRoll = {
  dieType: PixelDieType;
  value: number;
};

export type RollFormulaResult<T extends DieRoll> = {
  value: number;
  dropped?: Readonly<T>[]; // Rolls that were dropped by a modifier
};

function getUsedRolls<T extends DieRoll>(
  { dieType, count }: { dieType: RollDieType; count: number },
  refRolls: Readonly<T>[]
): Readonly<T>[] {
  const rolls = [];
  const otherDieType: PixelDieType | undefined =
    dieType === "d6" ? "d6pipped" : undefined;
  for (let i = 0; i < count; ++i) {
    if (dieType === "d100") {
      const tens = refRolls.findIndex((r) => r.dieType === "d00");
      if (tens >= 0) {
        rolls.push(refRolls[tens]);
        refRolls.splice(tens, 1);
      }
      const units = refRolls.findIndex((r) => r.dieType === "d10");
      if (units >= 0) {
        rolls.push(refRolls[units]);
        refRolls.splice(units, 1);
      }
      if (tens < 0 && units < 0) {
        break;
      }
    } else {
      const index = refRolls.findIndex(
        (r) => r.dieType === dieType || r.dieType === otherDieType
      );
      if (index >= 0) {
        rolls.push(refRolls[index]);
        refRolls.splice(index, 1);
      } else {
        break;
      }
    }
  }
  return rolls;
}

function computeForOperator<T extends DieRoll>(
  left: Readonly<RollFormulaResult<T>>,
  right: Readonly<RollFormulaResult<T>>,
  operator: RollOperator
): RollFormulaResult<T> {
  let result: number;
  switch (operator) {
    case "+":
      result = left.value + right.value;
      break;
    case "-":
      result = left.value - right.value;
      break;
    case "*":
      result = left.value * right.value;
      break;
    case "/":
      result = right.value ? left.value / right.value : left.value;
      break;
    case ",":
      throw new Error("Comma operator not supported");
    default:
      assertNever(operator, `Unknown operator ${operator}`);
  }
  return {
    value: result,
    dropped: [...(left.dropped ?? []), ...(right.dropped ?? [])],
  };
}

function aggregateResults<T extends DieRoll>(
  results: Readonly<
    RollFormulaResult<T> & {
      usedRolls: Readonly<T>[] | Readonly<T>;
      ignoreValue?: boolean;
    }
  >[],
  start: number,
  end?: number
): RollFormulaResult<T> {
  let result = 0;
  let dropped: Readonly<T>[] | undefined;
  const count = results.length;
  end ??= count;
  for (let i = 0; i < count; i++) {
    const { value: r, dropped: d, usedRolls, ignoreValue } = results[i];
    if (i >= start && i < end) {
      if (!ignoreValue) {
        result += r;
      }
      if (d) {
        dropped ??= [];
        dropped.push(...d);
      }
    } else if (usedRolls) {
      dropped ??= [];
      if (Array.isArray(usedRolls)) {
        dropped.push(...usedRolls); // usedRolls also contains dropped rolls
      } else {
        dropped.push(usedRolls);
      }
    }
  }
  return { value: result, dropped };
}

function computeForModifier<T extends DieRoll>(
  { modifier, count }: { modifier: RollModifier; count: number },
  results: Readonly<
    RollFormulaResult<T> & {
      usedRolls: Readonly<T>[] | Readonly<T>;
      ignoreValue?: boolean;
    }
  >[]
): RollFormulaResult<T> {
  results.sort(({ value: a }, { value: b }) => a - b);
  const i = Math.min(Math.max(0, count), results.length);
  switch (modifier) {
    case "kh":
      return aggregateResults(results, results.length - i);
    case "kl":
      return aggregateResults(results, 0, i);
    case "dh":
      return aggregateResults(results, 0, results.length - i);
    case "dl":
      return aggregateResults(results, i);
    default:
      assertNever(modifier, `Unknown modifier ${modifier}`);
  }
}

function getRollsForModifier<T extends DieRoll>(
  { modifier, count }: { modifier: RollModifier; count: number },
  rolls: Readonly<T>[]
): Readonly<T>[] {
  rolls.sort(({ value: a }, { value: b }) => a - b);
  const i = Math.min(Math.max(0, count), rolls.length);
  switch (modifier) {
    case "kh":
      return rolls.slice(rolls.length - i);
    case "kl":
      return rolls.slice(0, i);
    case "dh":
      return rolls.slice(0, rolls.length - i);
    case "dl":
      return rolls.slice(i);
    default:
      assertNever(modifier, `Unknown modifier ${modifier}`);
  }
}

function hasNoUndefined<T>(values: (T | undefined)[]): values is T[] {
  return values.every((v) => v !== undefined);
}

// Used rolls are removed from refRolls
// Return a result if all required rolls are present
export function computeRollFormula<T extends DieRoll>(
  formula: Readonly<RollFormulaTree>,
  refRolls: Readonly<T>[]
): RollFormulaResult<T> | undefined {
  const { kind } = formula;
  switch (kind) {
    case "constant":
      return { value: formula.value };
    case "dice": {
      const usedRolls = getUsedRolls(formula, refRolls);
      const { dieType, count } = formula;
      if (dieType === "d100") {
        const tens = usedRolls.filter((r) => r.dieType === "d00");
        const units = usedRolls.filter((r) => r.dieType === "d10");
        return tens.length === count && units.length === count
          ? {
              value: range(count).reduce((sum, i) => {
                const t = tens[i];
                const u = units[i];
                const v = t.value + u.value;
                return (
                  sum +
                  ("ignoreValue" in t || "ignoreValue" in u ? 0 : v ? v : 100)
                );
              }, 0),
            }
          : undefined;
      } else {
        return usedRolls.length === count
          ? {
              value: usedRolls.reduce(
                (sum, r) => sum + ("ignoreValue" in r ? 0 : r.value),
                0
              ),
            }
          : undefined;
      }
    }
    case "modifier": {
      if (!formula.groups.length) {
        return { value: 0 };
      } else if (formula.groups.length === 1) {
        const dice = formula.groups[0];
        if (dice.kind === "dice") {
          const usedRolls = getUsedRolls(dice, refRolls);
          const { dieType, count } = dice;
          if (dieType === "d100") {
            const tens = usedRolls.filter((r) => r.dieType === "d00");
            const units = usedRolls.filter((r) => r.dieType === "d10");
            if (tens.length === count && units.length === count) {
              return computeForModifier(
                formula,
                range(count).map((i) => {
                  const t = tens[i];
                  const u = units[i];
                  return {
                    value: t.value + u.value,
                    usedRolls: [t, u],
                    ignoreValue: "ignoreValue" in t || "ignoreValue" in u,
                  };
                })
              );
            }
          } else if (usedRolls.length === count) {
            return computeForModifier(
              formula,
              usedRolls.map((r) => ({
                value: r.value,
                usedRolls: r,
                ignoreValue: "ignoreValue" in r,
              }))
            );
          }
          return;
        } else {
          // See which dice are dropped within the formula single element
          const originalRolls = [...refRolls];
          const res = computeRollFormula(dice, refRolls);
          if (res === undefined) {
            // We're missing some rolls
            return;
          }
          // Get the rolls used (not dropped) by the modifier,
          // taking into account the already dropped rolls
          const keptRolls = getRollsForModifier(
            formula,
            originalRolls.filter(
              (r) => !refRolls.includes(r) && !res.dropped?.includes(r)
            )
          );
          // Recompute the formula but ignoring the values of the dropped rolls
          const finalRes = computeRollFormula(
            dice,
            originalRolls.map((r) =>
              keptRolls.includes(r) ? r : { ...r, ignoreValue: true }
            )
          );
          return {
            value: finalRes?.value ?? 0, // Should always be defined
            dropped: originalRolls.filter(
              (r) => !refRolls.includes(r) && !keptRolls.includes(r)
            ),
          };
        }
      } else {
        const results = formula.groups.map((g) => {
          const originalRolls = [...refRolls];
          const res = computeRollFormula(g, refRolls);
          const usedRolls = originalRolls.filter((r) => !refRolls.includes(r));
          return res && { ...res, usedRolls };
        });
        return hasNoUndefined(results)
          ? computeForModifier(formula, results)
          : undefined;
      }
    }
    case "operation": {
      const left = computeRollFormula(formula.left, refRolls);
      const right = computeRollFormula(formula.right, refRolls);
      return left !== undefined && right !== undefined
        ? computeForOperator(left, right, formula.operator)
        : undefined;
    }
    default:
      assertNever(kind, `Unknown formula kind ${kind}`);
  }
}

export function getFormulaRollsMapping<T extends DieRoll>(
  formula: Readonly<RollFormulaTree>,
  refRolls: Readonly<T>[]
): Map<RollFormulaElement, Readonly<T>[]> {
  const mapping = new Map();
  const getRolls = (formula: Readonly<RollFormulaTree>): void => {
    const { kind } = formula;
    switch (kind) {
      case "constant":
        break;
      case "dice": {
        const usedRolls = getUsedRolls(formula, refRolls);
        if (usedRolls?.length) {
          mapping.set(formula, usedRolls);
        }
        break;
      }
      case "modifier":
        formula.groups.forEach((group) => getRolls(group));
        break;
      case "operation":
        getRolls(formula.left);
        getRolls(formula.right);
        break;
      default:
        assertNever(kind, `Unknown formula kind ${kind}`);
    }
  };
  getRolls(formula);
  return mapping;
}
