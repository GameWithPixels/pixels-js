import React from "react";

import { parseRollFormula, RollFormulaTree } from "~/features/rollFormula";

export function useRollFormulaTree(
  formula?: string
): RollFormulaTree | undefined {
  return React.useMemo(() => {
    try {
      return formula?.length ? parseRollFormula(formula) : undefined;
    } catch (e) {
      console.log("Error parsing formula:" + e);
    }
  }, [formula]);
}
