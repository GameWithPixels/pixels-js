import { convertDieTypeForFormula, RollFormulaTree } from "./rollFormula";
import { RollDieType } from "./types";

export type SimplifiedRollFormula = {
  dieType: RollDieType;
  dieCount: number; // Always 1 if modifier is set
  constant: number;
  modifier?: "advantage" | "disadvantage";
  bonus?: "guidance";
};

export function simplifiedFormulaToString({
  dieType,
  dieCount,
  constant,
  modifier,
  bonus,
}: Readonly<SimplifiedRollFormula>): string {
  const dice = `${dieCount}${convertDieTypeForFormula(dieType)}`;
  let str = modifier
    ? `${dice}${modifier === "advantage" ? "kh" : "kl"}1`
    : dice;
  if (bonus) {
    str += "+1d4";
  }
  if (constant) {
    str += constant > 0 ? `+${constant}` : constant.toString();
  }
  return str;
}

export function getSimplifiedRollFormula(
  formula: Readonly<RollFormulaTree>
): SimplifiedRollFormula | undefined {
  switch (formula.kind) {
    case "dice":
      return {
        dieType: formula.dieType,
        dieCount: formula.count,
        constant: 0,
      };
    case "modifier": {
      // Advantage/disadvantage
      if (
        (formula.modifier === "kh" || formula.modifier === "kl") &&
        formula.groups.length === 1 &&
        formula.groups[0].kind === "dice" &&
        formula.groups[0].count === 2
      ) {
        return {
          dieType: formula.groups[0].dieType,
          dieCount: 2,
          constant: 0,
          modifier: formula.modifier === "kh" ? "advantage" : "disadvantage",
        };
      }
      break;
    }
    case "operation": {
      const left = getSimplifiedRollFormula(formula.left);
      if (!left) {
        break;
      }
      if (formula.right.kind === "constant") {
        if (!left.constant) {
          return {
            ...left,
            constant: formula.right.value,
          };
        }
      } else {
        const right = getSimplifiedRollFormula(formula.right);
        if (
          right &&
          right.dieType === "d4" &&
          right.dieCount === 1 &&
          (!left.constant || !right.constant) &&
          !right.modifier &&
          !right.bonus &&
          !left.bonus
        ) {
          return {
            ...left,
            constant: left.constant + right.constant,
            bonus: "guidance",
          };
        }
      }
      break;
    }
  }
}
