import { assertNever } from "@systemic-games/pixels-core-utils";

import { RollDieType, RollModifier, RollOperator } from "./types";

export type RollFormulaTree =
  | RollFormulaElement
  | {
      kind: "operation";
      operator: RollOperator;
      left: RollFormulaTree;
      right: RollFormulaTree;
    };

export type RollFormulaElement =
  | {
      kind: "constant";
      value: number;
    }
  | {
      kind: "dice";
      dieType: RollDieType;
      count: number;
    }
  | {
      kind: "modifier";
      modifier: RollModifier;
      count: number;
      groups: RollFormulaTree[];
    };

export function convertDieTypeForFormula(dieType: RollDieType): string {
  switch (dieType) {
    case "d4":
    case "d6":
    case "d8":
    case "d10":
    case "d12":
    case "d20":
    case "d100":
      return dieType;
    case "d00":
      return "d00";
    case "d6fudge":
      return "dF";
    default:
      assertNever(dieType, `Unknown die type ${dieType}`);
  }
}

export function rollFormulaToString(
  formula: Readonly<RollFormulaTree>
): string {
  const { kind } = formula;
  switch (kind) {
    case "constant":
      return formula.value.toString();
    case "dice":
      return `${formula.count}${convertDieTypeForFormula(formula.dieType)}`;
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
          .join(",")}${close}${formula.modifier}${formula.count}`;
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
