import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";

import { computeRollFormulaResult, RollFormula } from "~/features/rollFormula";

export type SingleRollEntry = {
  uuid: string;
  timestamp: number;
  pixelId: number;
  dieType: PixelDieType;
  value: number;
};

export type FormulaRollEntry = {
  uuid: string;
  timestamp: number; // Unique identifier
  formula: RollFormula;
  rolls: SingleRollEntry[];
  result?: {
    value: number;
    rollsIndices: number[];
  };
};

export type SingleRollsState = EntityState<SingleRollEntry>;

export const singleRollsAdapter = createEntityAdapter({
  selectId: (roll: Readonly<SingleRollEntry>) => roll.uuid,
});

export type FormulaRollsState = EntityState<FormulaRollEntry>;

export const formulaRollsAdapter = createEntityAdapter({
  selectId: (roll: Readonly<FormulaRollEntry>) => roll.uuid,
});

export type DiceRollerState = {
  singleRolls: SingleRollsState;
  formulaRolls: FormulaRollsState;
  settings: {
    paused: boolean;
    cardsAlignment: "left" | "right" | "center" | "alternate";
    cardsSizeRatio: number;
    activeEntryUuid?: string;
  };
};

function getInitialState(): DiceRollerState {
  return {
    singleRolls: singleRollsAdapter.getInitialState(),
    formulaRolls: formulaRollsAdapter.getInitialState(),
    settings: {
      paused: false,
      cardsAlignment: "right",
      cardsSizeRatio: 0.5,
    },
  };
}

function log(
  action:
    | "resetDiceRoller"
    | "addRollEntry"
    | "addFormulaRollEntry"
    | "updateFormulaRollEntry"
    | "removeRollerEntry"
    | "removeAllRollerEntries"
    | "setRollerPaused"
    | "setRollerActiveEntryUuid",
  payload?: unknown
) {
  logWrite(payload ? `${action}, payload: ${JSON.stringify(payload)}` : action);
}

// 64 because we are geeks!
function keepLessThan64Rolls(state: DiceRollerState) {
  const { singleRolls, formulaRolls } = state;
  while (singleRolls.ids.length + formulaRolls.ids.length >= 64) {
    const oldestSingle =
      singleRolls.entities[singleRolls.ids[0]]?.timestamp ?? -1;
    const oldestFormula =
      formulaRolls.entities[formulaRolls.ids[0]]?.timestamp ?? -1;
    if (oldestSingle < oldestFormula) {
      singleRollsAdapter.removeOne(singleRolls, oldestSingle);
    } else if (state.settings.activeEntryUuid !== formulaRolls.ids[0]) {
      formulaRollsAdapter.removeOne(formulaRolls, oldestFormula);
    } else {
      break;
    }
  }
}

function getFormulaResult(
  formula: FormulaRollEntry["formula"],
  rolls: FormulaRollEntry["rolls"]
): { value: number; rollsIndices: number[] } | undefined {
  const leftRolls = [...rolls];
  const value = computeRollFormulaResult(formula, leftRolls);
  if (value !== undefined) {
    const rollsIndices = [];
    for (let i = 0; i < rolls.length; ++i) {
      const j = leftRolls.findIndex((r) => r.pixelId === rolls[i].pixelId);
      if (j < 0) {
        rollsIndices.push(i);
      } else {
        leftRolls.splice(j, 1);
      }
    }
    return { value, rollsIndices };
  }
}

// Redux slice that stores rolls for the dice roller
const DiceRollerSlice = createSlice({
  name: "DiceRoller",
  initialState: getInitialState,
  reducers: {
    resetDiceRoller() {
      log("resetDiceRoller");
      return getInitialState();
    },

    addRollEntry(state, action: PayloadAction<SingleRollEntry>) {
      const { paused, activeEntryUuid } = state.settings;
      if (!paused) {
        keepLessThan64Rolls(state);
        const { uuid, timestamp, pixelId, dieType, value } = action.payload;
        const roll = {
          uuid,
          timestamp,
          pixelId,
          dieType,
          value,
        } as const;
        const formulaEntry =
          activeEntryUuid && state.formulaRolls.entities[activeEntryUuid];
        if (formulaEntry) {
          // Add roll to active formula if it exists
          log("addRollEntry", { entry: "formula", value });
          const rolls = [...formulaEntry.rolls, roll];
          const result =
            formulaEntry.result ??
            getFormulaResult(formulaEntry.formula, rolls);
          formulaRollsAdapter.updateOne(state.formulaRolls, {
            id: formulaEntry.uuid,
            changes: { rolls, result },
          });
          if (result) {
            state.settings.activeEntryUuid = undefined;
          }
        } else {
          log("addRollEntry", { entry: "single", value });
          singleRollsAdapter.addOne(state.singleRolls, roll);
        }
      }
    },

    addFormulaRollEntry(state, action: PayloadAction<FormulaRollEntry>) {
      if (!state.settings.paused) {
        log("addFormulaRollEntry");
        keepLessThan64Rolls(state);
        const { uuid, timestamp, formula, rolls } = action.payload;
        formulaRollsAdapter.addOne(state.formulaRolls, {
          uuid,
          timestamp,
          formula,
          rolls,
        });
        state.settings.activeEntryUuid = uuid;
      }
    },

    updateFormulaRollEntry(
      state,
      action: PayloadAction<Pick<FormulaRollEntry, "uuid" | "formula">>
    ) {
      const { uuid, formula } = action.payload;
      const formulaEntry = state.formulaRolls.entities[uuid];
      if (formulaEntry) {
        log("updateFormulaRollEntry");
        const result = getFormulaResult(formula, formulaEntry.rolls);
        formulaRollsAdapter.updateOne(state.formulaRolls, {
          id: uuid,
          changes: { formula, result },
        });
      }
    },

    removeRollerEntry(state, action: PayloadAction<string>) {
      log("removeRollerEntry");
      singleRollsAdapter.removeOne(state.singleRolls, action.payload);
      formulaRollsAdapter.removeOne(state.formulaRolls, action.payload);
    },

    removeAllRollerEntries(state) {
      log("removeAllRollerEntries");
      singleRollsAdapter.removeAll(state.singleRolls);
      formulaRollsAdapter.removeAll(state.formulaRolls);
    },

    setRollerPaused(state, action: PayloadAction<boolean>) {
      log("setRollerPaused");
      state.settings.paused = action.payload;
    },

    setRollerCardsSizeRatio(state, action: PayloadAction<number>) {
      state.settings.cardsSizeRatio = action.payload;
    },

    setRollerCardsAlignment(
      state,
      action: PayloadAction<DiceRollerState["settings"]["cardsAlignment"]>
    ) {
      state.settings.cardsAlignment = action.payload;
    },

    setRollerActiveEntryUuid(state, action: PayloadAction<string | undefined>) {
      log("setRollerActiveEntryUuid");
      state.settings.activeEntryUuid = action.payload;
    },
  },
});

export const {
  resetDiceRoller,
  addRollEntry,
  addFormulaRollEntry,
  updateFormulaRollEntry,
  removeRollerEntry,
  removeAllRollerEntries,
  setRollerPaused,
  setRollerCardsSizeRatio,
  setRollerCardsAlignment,
  setRollerActiveEntryUuid,
} = DiceRollerSlice.actions;
export default DiceRollerSlice.reducer;
