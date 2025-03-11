import { assertNever } from "@systemic-games/pixels-core-utils";

import { RollFormulaTree } from "./rollFormula";
import { RollDieType } from "./types";

function getDice(
  formula: Readonly<RollFormulaTree>,
  refDice: RollDieType[]
): void {
  const { kind } = formula;
  switch (kind) {
    case "constant":
      return;
    case "dice":
      refDice.push(formula.dieType);
      return;
    case "modifier":
      formula.groups.forEach((group) => getDice(group, refDice));
      return;
    case "operation":
      getDice(formula.left, refDice);
      getDice(formula.right, refDice);
      return;
    default:
      assertNever(kind, `Unknown formula kind ${kind}`);
  }
}

export function getRollFormulaDice(
  formula: Readonly<RollFormulaTree>
): RollDieType[] {
  const dice: RollDieType[] = [];
  getDice(formula, dice);
  return dice;
}
