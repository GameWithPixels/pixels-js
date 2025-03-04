import { assertNever } from "@systemic-games/pixels-core-utils";

import { RollFormulaTree } from "./rollFormula";
import { RollDieType } from "./tokenizer";

export type SimplifiedRollFormula = {
  dieType: RollDieType;
  dieCount: number; // Always 1 if modifier is set
  constant: number;
  modifier?: "advantage" | "disadvantage";
  bonus?: "guidance";
};

export function convertSimplifiedFormula({
  dieType,
  dieCount,
  constant,
  modifier,
  bonus,
}: Readonly<SimplifiedRollFormula>): RollFormulaTree {
  // Check for bonus first
  if (bonus === "guidance") {
    const left = convertSimplifiedFormula({
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
        count: 1,
      },
    };
  }
  const dice = {
    kind: "dice",
    dieType,
    count: dieCount,
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
      const formula: RollFormulaTree = {
        kind: "modifier",
        modifier: modifier === "advantage" ? "kh" : "kl",
        count: 1,
        groups: [
          {
            kind: "dice",
            dieType,
            count: 2,
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
  formula: Readonly<RollFormulaTree>
): SimplifiedRollFormula | undefined {
  // Constant
  if (formula.kind === "constant") {
    return;
  }
  // Dice count
  if (formula.kind === "dice") {
    return {
      dieType: formula.dieType,
      dieCount: formula.count,
      constant: 0,
    };
  }
  // "Simple" modifiers
  if (
    formula.kind === "modifier" &&
    (formula.modifier === "kh" || formula.modifier === "kl") &&
    formula.groups.length === 1 &&
    formula.groups[0].kind === "dice" &&
    formula.groups[0].count === 2
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
    // Assume operation between dice or modifier, and a constant, dice or an operation
    const [diceOrModifier, constOrDiceOrOp] =
      formula.left.kind === "dice" || formula.left.kind === "modifier"
        ? [formula.left, formula.right]
        : [formula.right, formula.left];
    const [constant, bonus] =
      constOrDiceOrOp.kind === "constant"
        ? [constOrDiceOrOp, undefined]
        : constOrDiceOrOp.kind === "dice"
          ? [undefined, constOrDiceOrOp]
          : constOrDiceOrOp.kind !== "operation"
            ? [undefined, undefined]
            : constOrDiceOrOp.left.kind === "constant"
              ? [constOrDiceOrOp.left, constOrDiceOrOp.right]
              : [constOrDiceOrOp.right, constOrDiceOrOp.left];
    if (
      (diceOrModifier.kind === "dice" || diceOrModifier.kind === "modifier") &&
      (!constant || constant.kind === "constant") &&
      (!bonus ||
        (bonus.kind === "dice" && bonus.dieType === "d4" && bonus.count === 1))
    ) {
      const parts = getSimplifiedRollFormula(diceOrModifier);
      if (parts) {
        return {
          ...parts,
          constant: constant
            ? constant.value * (formula.operator === "-" ? -1 : 1)
            : 0,
          bonus: bonus ? "guidance" : undefined,
        };
      }
    }
  }
}
