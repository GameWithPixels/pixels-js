import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";

import { computeRollFormula, parseRollFormula } from "~/features/rollFormula";
import { generateUuid, logError } from "~/features/utils";

export type DieRoll = {
  timestamp: number;
  pixelId: number;
  dieType: Exclude<PixelDieType, "unknown">;
  value: number;
};

export type RollerEntry = {
  uuid: string;
  rolls: DieRoll[];
  value?: number;
  formula?: string; // Optional formula, if none it's a single roll
  droppedRolls?: number[]; // Indices of dropped rolls in the rolls array
  unusedRolls?: number[]; // Indices of unused rolls in the rolls array
};

export type RollerEntryWithFormula = Omit<RollerEntry, "formula"> &
  Required<Pick<RollerEntry, "formula">>;

export type RollerEntriesState = EntityState<RollerEntry>;

export const rollerEntriesAdapter = createEntityAdapter<RollerEntry>({
  selectId: (roll: Readonly<RollerEntry>) => roll.uuid,
});

export type DiceRollerState = {
  entries: RollerEntriesState;
  paused: boolean;
  lastRollFormula: string;
  activeRollFormula?: RollerEntryWithFormula;
  settings: {
    cardsAlignment: "left" | "right" | "center" | "alternate";
    cardsSizeRatio: number;
  };
};

function getInitialState(): DiceRollerState {
  return {
    entries: rollerEntriesAdapter.getInitialState(),
    paused: false,
    lastRollFormula: "1d20",
    settings: {
      cardsAlignment: "right",
      cardsSizeRatio: 0.5,
    },
  };
}

function log(
  action:
    | "resetDiceRoller"
    | "addRollToRoller"
    | "activateRollerFormula"
    | "updateRollerActiveFormula"
    | "removeRollerActiveFormulaRoll"
    | "commitRollerActiveFormula"
    | "removeRollerEntry"
    | "removeAllRollerEntries"
    | "setRollerPaused",
  payload?: unknown
) {
  logWrite(payload ? `${action}, payload: ${JSON.stringify(payload)}` : action);
}

function generateRollEntryUuid({ entries }: DiceRollerState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (entries.entities[uuid]);
  return uuid;
}

// 128 because we are geeks!
function keepAtMost128Entries(state: DiceRollerState) {
  const { entries } = state;
  const maxEntries = 128;
  if (entries.ids.length > maxEntries) {
    rollerEntriesAdapter.removeMany(
      entries,
      entries.ids.slice(0, entries.ids.length - maxEntries)
    );
  }
}

function getFormulaResult(
  formula: string,
  rolls: readonly Readonly<{
    pixelId: number;
    dieType: PixelDieType;
    value: number;
  }>[]
): { value?: number; droppedRolls?: number[]; unusedRolls?: number[] } {
  try {
    const unusedRolls = [...rolls];
    const result = computeRollFormula(parseRollFormula(formula), unusedRolls);
    return {
      value: result?.value,
      droppedRolls: result?.dropped?.map((r) => rolls.indexOf(r)),
      unusedRolls: unusedRolls.map((r) => rolls.indexOf(r)),
    };
  } catch (e) {
    logError(`Error while computing roll formula result: ${e}`);
    return {};
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

    addRollToRoller(state, action: PayloadAction<Omit<DieRoll, "timestamp">>) {
      const { paused, activeRollFormula: formula } = state;
      if (!paused) {
        keepAtMost128Entries(state);
        const { pixelId, dieType, value } = action.payload;
        const roll = {
          timestamp: Date.now(),
          pixelId,
          dieType,
          value,
        } as const;
        if (formula) {
          // Add roll to active formula
          log("addRollToRoller", { entry: "formula", roll });
          formula.rolls.push(roll);
          if (formula.value === undefined) {
            const { value, droppedRolls, unusedRolls } = getFormulaResult(
              formula.formula,
              formula.rolls
            );
            formula.value = value;
            formula.droppedRolls = droppedRolls;
            formula.unusedRolls = unusedRolls;
          } else {
            // Formula already computed, this new roll is unused
            formula.unusedRolls ??= [];
            formula.unusedRolls.push(formula.rolls.length - 1);
          }
        } else {
          // Add single roll
          log("addRollToRoller", { entry: "single", roll });
          rollerEntriesAdapter.addOne(state.entries, {
            uuid: generateRollEntryUuid(state),
            rolls: [roll],
            value,
          });
        }
      }
    },

    activateRollerFormula(state, action: PayloadAction<string | undefined>) {
      log("activateRollerFormula");
      const entry = state.entries.entities[action.payload ?? ""];
      if (entry) {
        const { uuid, formula, rolls, droppedRolls, unusedRolls, value } =
          entry;
        state.activeRollFormula = {
          uuid,
          value,
          formula: formula ?? state.lastRollFormula,
          rolls,
          droppedRolls,
          unusedRolls,
        };
      } else {
        state.activeRollFormula = {
          uuid: generateRollEntryUuid(state),
          formula: state.lastRollFormula,
          rolls: [],
        };
      }
    },

    updateRollerActiveFormula(state, action: PayloadAction<string>) {
      log("updateRollerActiveFormula");
      const { activeRollFormula: formula } = state;
      if (formula && formula.formula !== action.payload) {
        formula.formula = action.payload;
        const { value, droppedRolls, unusedRolls } = getFormulaResult(
          formula.formula,
          formula.rolls
        );
        formula.value = value;
        formula.droppedRolls = droppedRolls;
        formula.unusedRolls = unusedRolls;
      }
    },

    removeRollerActiveFormulaRoll(state, action: PayloadAction<number>) {
      log("removeRollerActiveFormulaRoll");
      const timestamp = action.payload;
      const { activeRollFormula: formula } = state;
      if (formula) {
        const i = formula.rolls.findIndex((r) => r.timestamp === timestamp);
        if (i >= 0) {
          formula.rolls.splice(i, 1);
          // Check if we need to update the result
          if (formula.value !== undefined || formula.unusedRolls) {
            const { value, droppedRolls, unusedRolls } = getFormulaResult(
              formula.formula,
              formula.rolls
            );
            formula.value = value;
            formula.droppedRolls = droppedRolls;
            formula.unusedRolls = unusedRolls;
          }
        }
      }
    },

    commitRollerActiveFormula(state) {
      const { activeRollFormula: formula } = state;
      if (formula) {
        // Add or update entry only if there are rolls or entry already exists
        const commit =
          formula.rolls.length > 0 || !!state.entries.entities[formula.uuid];
        log("commitRollerActiveFormula", { commit });
        if (commit) {
          keepAtMost128Entries(state);
          rollerEntriesAdapter.upsertOne(state.entries, formula);
          state.lastRollFormula = formula.formula;
          state.activeRollFormula = undefined;
        }
        state.lastRollFormula = formula.formula;
        state.activeRollFormula = undefined;
      }
    },

    removeRollerEntry(state, action: PayloadAction<string>) {
      log("removeRollerEntry");
      rollerEntriesAdapter.removeOne(state.entries, action.payload);
    },

    removeAllRollerEntries(state) {
      log("removeAllRollerEntries");
      rollerEntriesAdapter.removeAll(state.entries);
    },

    setRollerPaused(state, action: PayloadAction<boolean>) {
      log("setRollerPaused");
      state.paused = action.payload;
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
  },
});

export const {
  resetDiceRoller,
  addRollToRoller,
  activateRollerFormula,
  updateRollerActiveFormula,
  removeRollerActiveFormulaRoll,
  commitRollerActiveFormula,
  removeRollerEntry,
  removeAllRollerEntries,
  setRollerPaused,
  setRollerCardsSizeRatio,
  setRollerCardsAlignment,
} = DiceRollerSlice.actions;
export default DiceRollerSlice.reducer;
