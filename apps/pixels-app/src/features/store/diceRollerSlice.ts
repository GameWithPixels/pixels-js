import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";

import {
  computeRollFormulaResult,
  parseRollFormula,
} from "~/features/rollFormula";
import { generateUuid, logError } from "~/features/utils";

export type DieRoll = {
  timestamp: number;
  pixelId: number;
  dieType: PixelDieType;
  value: number;
};

export type RollerEntry = {
  uuid: string;
  rolls: DieRoll[];
  formula?: string; // Optional formula, if none it's a single roll
  result?: {
    value: number;
    rollsIndices: number[];
  };
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
): { value: number; rollsIndices: number[] } | undefined {
  try {
    const leftRolls = [...rolls];
    const value = computeRollFormulaResult(
      parseRollFormula(formula),
      leftRolls
    );
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
  } catch (e) {
    logError(`Error while computing roll formula result: ${e}`);
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
      const { paused, activeRollFormula } = state;
      if (!paused) {
        keepAtMost128Entries(state);
        const { pixelId, dieType, value } = action.payload;
        const roll = {
          timestamp: Date.now(),
          pixelId,
          dieType,
          value,
        } as const;
        if (activeRollFormula) {
          // Add roll to active formula
          log("addRollToRoller", { entry: "formula", roll });
          activeRollFormula.rolls.push(roll);
          activeRollFormula.result ??= getFormulaResult(
            activeRollFormula.formula,
            activeRollFormula.rolls
          );
        } else {
          // Add single roll
          log("addRollToRoller", { entry: "single", roll });
          rollerEntriesAdapter.addOne(state.entries, {
            uuid: generateRollEntryUuid(state),
            rolls: [roll],
            result: {
              value,
              rollsIndices: [0],
            },
          });
        }
      }
    },

    activateRollerFormula(state, action: PayloadAction<string | undefined>) {
      log("activateRollerFormula");
      const entry = state.entries.entities[action.payload ?? ""];
      if (entry) {
        const { uuid, formula, rolls, result } = entry;
        state.activeRollFormula = {
          uuid,
          formula: formula ?? state.lastRollFormula,
          rolls,
          result,
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
      const { activeRollFormula } = state;
      if (activeRollFormula) {
        activeRollFormula.formula = action.payload;
        activeRollFormula.result = getFormulaResult(
          activeRollFormula.formula,
          activeRollFormula.rolls
        );
      }
    },

    removeRollerActiveFormulaRoll(state, action: PayloadAction<number>) {
      log("removeRollerActiveFormulaRoll");
      const timestamp = action.payload;
      const { activeRollFormula } = state;
      if (activeRollFormula) {
        const i = activeRollFormula.rolls.findIndex(
          (r) => r.timestamp === timestamp,
          1
        );
        if (i >= 0) {
          activeRollFormula.rolls.splice(i, 1);
          activeRollFormula.result = getFormulaResult(
            activeRollFormula.formula,
            activeRollFormula.rolls
          );
        }
      }
    },

    commitRollerActiveFormula(state) {
      const { activeRollFormula } = state;
      if (activeRollFormula) {
        // Add or update entry only if there are rolls or entry already exists
        const commit =
          activeRollFormula.rolls.length > 0 ||
          !!state.entries.entities[activeRollFormula.uuid];
        log("commitRollerActiveFormula", { commit });
        if (commit) {
          keepAtMost128Entries(state);
          rollerEntriesAdapter.upsertOne(state.entries, activeRollFormula);
          state.lastRollFormula = activeRollFormula.formula;
          state.activeRollFormula = undefined;
        }
        state.lastRollFormula = activeRollFormula.formula;
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
