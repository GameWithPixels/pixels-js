import { PixelDieType } from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { RollFormulaTree } from "./rollFormula";
import { RollDieType, RollModifier } from "./tokenizer";

type DieRoll = Readonly<{
  dieType: PixelDieType;
  value: number;
}>;

function getUsedRolls(
  { dieType, count }: { dieType: RollDieType; count: number },
  refRolls: DieRoll[]
): DieRoll[] | undefined {
  const rolls = [];
  for (let i = 0; i < count; ++i) {
    const index = refRolls.findIndex((r) => r.dieType === dieType);
    if (index >= 0) {
      rolls.push(refRolls[index]);
      refRolls.splice(index, 1);
    } else {
      return;
    }
  }
  return rolls;
}

function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

function computeForModifier(
  values: number[],
  { modifier, count }: { modifier: RollModifier; count: number }
): number {
  values.sort((a, b) => a - b);
  const p = Math.min(Math.max(0, count), values.length);
  switch (modifier) {
    case "kh":
      return sum(values.slice(values.length - p));
    case "kl":
      return sum(values.slice(0, p));
    case "dh":
      return sum(values.slice(0, values.length - p));
    case "dl":
      return sum(values.slice(p));
    default:
      assertNever(modifier, `Unknown modifier ${modifier}`);
  }
}

// Used rolls are removed from refRolls
export function computeRollFormulaResult(
  formula: Readonly<RollFormulaTree>,
  refRolls: Readonly<DieRoll>[]
): number | undefined {
  const { kind } = formula;
  switch (kind) {
    case "constant":
      return formula.value;
    case "dice": {
      const usedRolls = getUsedRolls(formula, refRolls);
      return usedRolls?.reduce((sum, r) => sum + r.value, 0);
    }
    case "modifier": {
      if (!formula.groups.length) {
        return 0;
      } else if (formula.groups.length === 1) {
        const dice = formula.groups[0];
        if (dice.kind === "dice") {
          const usedRolls = getUsedRolls(dice, refRolls)?.map((r) => r.value);
          return usedRolls && computeForModifier(usedRolls, formula);
        } else {
          // 1. Collect all dice rolls that are not attached to another modifier
          // 2. Keep/drop rolls accordingly to the modifier
          // 3. Compute the formula with the dropped rolls values set to 0
          console.warn(
            `Unsupported roll formula modifier with single element of type ${dice.kind}`
          );
        }
      } else {
        const values = formula.groups.map((g) =>
          computeRollFormulaResult(g, refRolls)
        );
        if (!values.includes(undefined)) {
          return computeForModifier(values as number[], formula);
        }
      }
      break;
    }
    case "operation": {
      const left = computeRollFormulaResult(formula.left, refRolls);
      const right = computeRollFormulaResult(formula.right, refRolls);
      if (left !== undefined && right !== undefined) {
        const { operator } = formula;
        switch (operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            return left / right;
          case ",":
            throw new Error("Comma operator not supported");
          default:
            assertNever(operator, `Unknown operator ${operator}`);
        }
      }
      break;
    }
    default:
      assertNever(kind, `Unknown formula kind ${kind}`);
  }
}
