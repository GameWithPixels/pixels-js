import { PixelDieType } from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { AvailableDieType } from "~/features/dice";

export type RollFormulaOperator = "+" | "-";

// https://wiki.roll20.net/Dice_Reference#Roll_Modifiers
export type RollModifier = "kh" | "kl" | "dh" | "dl";

export type RollFormula =
  | RollFormulaElement
  | {
      kind: "operation";
      operator: RollFormulaOperator;
      left: RollFormula;
      right: RollFormula;
    };

export type RollFormulaElement =
  | {
      kind: "constant";
      value: number;
    }
  | {
      kind: "dice";
      dieType: AvailableDieType;
      dieCount: number;
    }
  | {
      kind: "modifier";
      modifier: RollModifier;
      parameter: number;
      groups: RollFormula[];
    };

export type SimplifiedRollFormula = {
  dieType: AvailableDieType;
  dieCount: number; // Always 1 if modifier is set
  constant: number;
  modifier?: "advantage" | "disadvantage";
  bonus?: "guidance";
};

export function createRollFormula({
  dieType,
  dieCount,
  constant,
  modifier,
  bonus,
}: Readonly<SimplifiedRollFormula>): RollFormula {
  // Check for bonus first
  if (bonus === "guidance") {
    const left = createRollFormula({
      dieType,
      dieCount,
      constant,
      modifier,
    });
    return {
      kind: "operation",
      operator: "+",
      left,
      right: {
        kind: "dice",
        dieType: "d4",
        dieCount: 1,
      },
    };
  }
  const dice = {
    kind: "dice",
    dieType,
    dieCount,
  } as const;
  switch (modifier) {
    case undefined:
      return constant
        ? {
            kind: "operation",
            operator: "+",
            left: dice,
            right: {
              kind: "constant",
              value: constant,
            },
          }
        : dice;
    case "advantage":
    case "disadvantage": {
      const formula: RollFormula = {
        kind: "modifier",
        modifier: modifier === "advantage" ? "kh" : "kl",
        parameter: 1,
        groups: [
          {
            kind: "dice",
            dieType,
            dieCount: 2,
          },
        ],
      };
      return constant
        ? {
            kind: "operation",
            operator: "+",
            left: formula,
            right: {
              kind: "constant",
              value: constant,
            },
          }
        : formula;
    }
    default:
      assertNever(modifier, `Unknown modifier ${modifier}`);
  }
}

export function getSimplifiedRollFormula(
  formula: Readonly<RollFormula>
): SimplifiedRollFormula | undefined {
  // Constant
  if (formula.kind === "constant") {
    return;
  }
  // Dice count
  if (formula.kind === "dice") {
    return {
      dieType: formula.dieType,
      dieCount: formula.dieCount,
      constant: 0,
    };
  }
  // "Simple" modifiers
  if (
    formula.kind === "modifier" &&
    (formula.modifier === "kh" || formula.modifier === "kl") &&
    formula.groups.length === 1 &&
    formula.groups[0].kind === "dice" &&
    formula.groups[0].dieCount === 2
  ) {
    // Simple advantage/disadvantage
    return {
      dieType: formula.groups[0].dieType,
      dieCount: 1,
      constant: 0,
      modifier: formula.modifier === "kh" ? "advantage" : "disadvantage",
    };
  }
  // Operation
  if (formula.kind === "operation") {
    // Assume operation between dice or modifier, and a constant
    const [diceOrModifier, constant] =
      formula.right.kind === "constant"
        ? [formula.left, formula.right]
        : [formula.right, formula.left];
    if (
      (diceOrModifier.kind === "dice" || diceOrModifier.kind === "modifier") &&
      constant.kind === "constant"
    ) {
      const parts = getSimplifiedRollFormula(diceOrModifier);
      if (parts && !parts.constant) {
        return {
          ...parts,
          constant: constant.value * (formula.operator === "-" ? -1 : 1),
        };
      }
    }
    // Check for guidance
    else if (
      formula.operator === "+" &&
      formula.right.kind === "dice" &&
      formula.right.dieType === "d4" &&
      formula.right.dieCount === 1
    ) {
      // We got a guidance modifier
      const parts = getSimplifiedRollFormula(formula.left);
      if (parts && !parts.bonus) {
        return {
          ...parts,
          bonus: "guidance",
        };
      }
    }
  }
}

function getDieName(dieType: PixelDieType): string {
  switch (dieType) {
    case "unknown":
      return "?";
    case "d4":
    case "d6":
    case "d8":
    case "d10":
    case "d12":
    case "d20":
      return dieType;
    case "d00":
      return "d00";
    case "d6pipped":
      return "pd6";
    case "d6fudge":
      return "fd6";
    default:
      assertNever(dieType, `Unknown die type ${dieType}`);
  }
}

export function rollFormulaToString(formula: Readonly<RollFormula>): string {
  const { kind } = formula;
  switch (kind) {
    case "constant":
      return formula.value.toString();
    case "dice":
      return `${formula.dieCount}${getDieName(formula.dieType)}`;
    case "modifier": {
      if (!formula.groups.length) {
        return "";
      } else {
        const hasGroups =
          formula.groups.length > 1 || formula.groups[0].kind === "operation";
        const open = hasGroups ? "{" : "";
        const close = hasGroups ? "}" : "";
        return `${open}${formula.groups
          .map((g) => rollFormulaToString(g))
          .join(",")}${close}${formula.modifier}${formula.parameter}`;
      }
    }
    case "operation": {
      let rightStr = rollFormulaToString(formula.right);
      let op = formula.operator;
      if (rightStr[0] === "-" && (op === "+" || op === "-")) {
        // Remove the negative sign
        rightStr = rightStr.slice(1);
        // Switch the operator
        op = op === "+" ? "-" : "+";
      }
      return `${rollFormulaToString(formula.left)}${op}${rightStr}`;
    }
    default:
      assertNever(formula, `Unknown formula kind ${kind}`);
  }
}

type Roll = {
  dieType: PixelDieType;
  value: number;
};

function getUsedRolls(
  { dieType, dieCount }: { dieType: AvailableDieType; dieCount: number },
  refRolls: Readonly<Roll>[]
): Readonly<Roll>[] | undefined {
  const rolls = [];
  for (let i = 0; i < dieCount; ++i) {
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
  {
    modifier,
    parameter,
  }: Pick<
    Extract<RollFormulaElement, { kind: "modifier" }>,
    "modifier" | "parameter"
  >
): number {
  values.sort((a, b) => a - b);
  const p = Math.min(Math.max(0, parameter), values.length);
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
  formula: Readonly<RollFormula>,
  refRolls: Readonly<{
    dieType: PixelDieType;
    value: number;
  }>[]
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
          const values = getUsedRolls(dice, refRolls)?.map((r) => r.value);
          return values && computeForModifier(values, formula);
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
      if (left && right) {
        return formula.operator === "+" ? left + right : left - right;
      }
      break;
    }
    default:
      assertNever(kind, `Unknown formula kind ${kind}`);
  }
}
