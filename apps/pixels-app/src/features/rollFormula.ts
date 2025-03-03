import {
  PixelDieType,
  PixelDieTypeValues,
} from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { Operator, RollModifier, Token } from "./rollFormula/tokenizer";

export type RollFormula =
  | RollFormulaElement
  | {
      kind: "operation";
      operator: Operator;
      left: RollFormula;
      right: RollFormula;
    };

type RollDieType = Exclude<PixelDieType, "unknown" | "d6pipped">;

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
      groups: RollFormula[];
    };

export type SimplifiedRollFormula = {
  dieType: RollDieType;
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
      const formula: RollFormula = {
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

function getDieName(dieType: Exclude<PixelDieType, "unknown">): string {
  switch (dieType) {
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
      return "d6";
    case "d6fudge":
      return "dF";
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
      return `${formula.count}${getDieName(formula.dieType)}`;
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
  {
    modifier,
    count,
  }: Pick<
    Extract<RollFormulaElement, { kind: "modifier" }>,
    "modifier" | "count"
  >
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
        return formula.operator === "+" ? left + right : left - right;
      }
      break;
    }
    default:
      assertNever(kind, `Unknown formula kind ${kind}`);
  }
}

export class RollFormulaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RollFormulaParseError";
  }
}

function parseElement(str: string): RollFormulaElement {
  if (!str.length) {
    throw new RollFormulaParseError("Empty element");
  }
  const mod =
    parseModifier(str, "kh") ??
    parseModifier(str, "kl") ??
    parseModifier(str, "dh") ??
    parseModifier(str, "dl");
  if (mod) {
    return mod;
  } else if (str.includes("d")) {
    for (const dt in PixelDieTypeValues) {
      const dieType = dt as PixelDieType;
      if (dieType !== "unknown" && dieType !== "d6pipped") {
        const dice = parseDice(str, dieType);
        if (dice) {
          return dice;
        }
      }
    }
    throw new RollFormulaParseError(`Invalid dice element: ${str}`);
  } else {
    const value = parseInt(str, 10);
    if (isNaN(value)) {
      throw new RollFormulaParseError(`Invalid constant element: ${str}`);
    }
    return { kind: "constant", value };
  }
}

function parseDice(
  str: string,
  dieType: RollDieType
): Extract<RollFormulaElement, { kind: "dice" }> | undefined {
  const i = str.indexOf(getDieName(dieType));
  if (i === 0) {
    throw new RollFormulaParseError(
      `Missing parameter for die type ${dieType}`
    );
  } else if (i > 0) {
    const count = parseInt(str.slice(0, i), 10);
    if (isNaN(count)) {
      throw new RollFormulaParseError(
        `Invalid die count for die type ${dieType}`
      );
    }
    return { kind: "dice", dieType, count };
  }
}

function parseModifier(
  str: string,
  modifier: RollModifier
): Extract<RollFormulaElement, { kind: "modifier" }> | undefined {
  const i = str.indexOf(modifier);
  if (i === 0) {
    throw new RollFormulaParseError(
      `Missing parameter for modifier ${modifier}`
    );
  } else if (i > 0) {
    const parameter = parseInt(str.slice(i + 2), 10);
    if (isNaN(parameter)) {
      throw new RollFormulaParseError(
        `Invalid parameter for modifier ${modifier}`
      );
    }
    return {
      kind: "modifier",
      modifier,
      count: parameter,
      groups: [parseElement(str.slice(0, i))],
    };
  }
}

function parseFormula(formula: string): RollFormula {
  const opIndex = formula.search(/[+-]/);
  if (opIndex < 0) {
    return parseElement(formula);
  } else {
    const left = parseElement(formula.slice(0, opIndex));
    const right = parseFormula(formula.slice(opIndex + 1));
    const op = formula[opIndex] as Operator;
    if (op === "-") {
      let firstNode = right;
      while (firstNode.kind === "operation") {
        firstNode = firstNode.left;
      }
      if (firstNode.kind === "constant") {
        firstNode.value *= -1;
      } else {
        // TODO the entire right side will be subtracted instead of just the next expression
        // => the tree should be built from the right
        throw new RollFormulaParseError(
          "Subtraction of non-constant not supported"
        );
      }
    } else if (op === "+") {
      return {
        kind: "operation",
        operator: "+",
        left,
        right,
      };
    }
    throw new RollFormulaParseError(`Invalid operator ${op}`);
  }
}

export function parseRollFormula(formula: string): RollFormula {
  return parseFormula(formula.replace(/\s/g, ""));
}

function makeFormula(
  operator?: Operator,
  left?: RollFormula,
  right?: RollFormula
): RollFormula {
  if (operator) {
    if (!left || !right) {
      throw new RollFormulaParseError("Unexpected group");
    }
    return {
      kind: "operation",
      operator,
      left,
      right,
    };
  } else {
    const form = left ?? right;
    if (!form || (left && right)) {
      console.log(
        `operator=${operator}, left=${JSON.stringify(left)}, right=${JSON.stringify(right)}`
      );
      throw new RollFormulaParseError("Invalid group");
    }
    return form;
  }
}

export function buildRollFormula(
  tokens: Token[],
  rStart?: number // exclusive, reading backwards!
): {
  formula: RollFormula;
  rEnd: number;
} {
  let formula: RollFormula | undefined;
  let currentOp: Operator | undefined;
  for (let i = rStart ?? tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    switch (token.type) {
      case "grouping": {
        if (token.operator === "(") {
          if (!formula || currentOp) {
            throw new RollFormulaParseError("Unexpected closing parenthesis");
          }
          return { formula, rEnd: i };
        } else if (token.operator !== ")") {
          throw new RollFormulaParseError(
            `Unexpected grouping operator ${token.operator}`
          );
        }
        const { formula: form, rEnd } = buildRollFormula(tokens, i - 1);
        const prev = tokens[rEnd];
        if (prev?.type !== "grouping" || prev.operator !== "(") {
          throw new RollFormulaParseError("Expecting opening parenthesis");
        }
        console.log(
          `grouping op=${currentOp}, formula=${!!formula}, form=${!!form}, rEnd=${rEnd}`
        );
        formula = makeFormula(currentOp, form, formula);
        currentOp = undefined;
        i = rEnd;
        break;
      }
      case "operator":
        if (token.operator === ",") {
          throw new RollFormulaParseError("Comma not yet supported");
        } else if (!formula || currentOp) {
          throw new RollFormulaParseError("Unexpected operator");
        } else {
          currentOp = token.operator;
        }
        break;
      case "constant":
        formula = makeFormula(
          currentOp,
          { kind: "constant", value: token.value },
          formula
        );
        currentOp = undefined;
        break;
      case "dice":
        formula = makeFormula(
          currentOp,
          { kind: "dice", dieType: token.dieType, count: token.count },
          formula
        );
        currentOp = undefined;
        break;
      case "modifier": {
        const { formula: form, rEnd } = buildRollFormula(tokens, i - 1);
        i = rEnd;
        formula = makeFormula(
          currentOp,
          {
            kind: "modifier",
            modifier: token.modifier,
            count: token.count,
            groups: [form],
          },
          formula
        );
        currentOp = undefined;
        break;
      }
    }
  }
  if (currentOp) {
    throw new RollFormulaParseError("Missing operand");
  } else if (!formula) {
    throw new RollFormulaParseError("Empty formula");
  }
  return { formula, rEnd: 0 };
}
