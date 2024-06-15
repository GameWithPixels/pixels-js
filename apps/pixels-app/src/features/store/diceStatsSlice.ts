import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

export interface DieSession {
  index: number;
  startTime: number; // Timestamp, 0 means not yet started
  endTime: number; // Timestamp of last roll
  rolls: number[];
}

export type DieSessionsState = EntityState<DieSession>;

export const sessionsAdapter = createEntityAdapter({
  selectId: (dieSession: Readonly<DieSession>) => dieSession.index,
});

export interface DieStats {
  pixelId: number;
  lastRolls: number[]; // The last few rolls
  sessions: DieSessionsState;
  paused: boolean;
}

export type DiceStatsState = EntityState<DieStats>;

export const diceStatsAdapter = createEntityAdapter({
  selectId: (dieStats: DieStats) => dieStats.pixelId,
});

// 4 hours in milliseconds
export const sessionMaxDuration = 4 * 60 * 60 * 1000;

function log(
  action:
    | "resetDiceStats"
    | "addDieRoll"
    | "removeDieSession"
    | "newDieSessionOnRoll"
) {
  logWrite(action);
}

function addSession(stats: DieStats, startTime: number): DieSession {
  const lastSession = stats.sessions.entities[stats.sessions.ids.at(-1) ?? 0];
  const session = {
    index: (lastSession?.index ?? 0) + 1,
    startTime,
    endTime: startTime,
    rolls: [],
  };
  stats.sessions = sessionsAdapter.addOne(stats.sessions, session);
  return session;
}

// Redux slice that stores paired dice statistics
const DiceStatsSlice = createSlice({
  name: "DiceStats",
  initialState: diceStatsAdapter.getInitialState(),
  reducers: {
    resetDiceStats() {
      log("resetDiceStats");
      return diceStatsAdapter.getInitialState();
    },

    addDieRoll(
      state,
      action: PayloadAction<{
        pixelId: number;
        roll: number;
      }>
    ) {
      log("addDieRoll");
      const { pixelId, roll } = action.payload;
      const stats: DieStats = state.entities[pixelId] ?? {
        pixelId,
        lastRolls: [],
        sessions: sessionsAdapter.getInitialState(),
        paused: false,
      };

      // Store roll
      if (stats.lastRolls.length > 10) {
        stats.lastRolls.shift();
      }
      stats.lastRolls.push(roll);

      if (!stats.paused) {
        const now = Date.now();
        // Continue last session if within 4 hours or if time is older than last session
        let lastSession =
          stats.sessions.entities[stats.sessions.ids.at(-1) ?? 0];
        if (!lastSession || now - lastSession.endTime > sessionMaxDuration) {
          lastSession = addSession(stats, now);
        }
        // Add roll to session
        lastSession.rolls.push(roll);
        lastSession.endTime = now;
      }

      return diceStatsAdapter.setOne(state, stats);
    },

    removeDieSession(
      state,
      action: PayloadAction<{
        pixelId: number;
        index: number;
      }>
    ) {
      log("removeDieSession");
      const { pixelId, index } = action.payload;
      const stats = state.entities[pixelId];
      if (stats?.sessions.entities[index]) {
        sessionsAdapter.removeOne(stats.sessions, index);
        // Re-create an empty session if there are no sessions left
        if (!stats.sessions.ids.length) {
          addSession(stats, Date.now());
        }
      }
    },

    setDieSessionPaused(
      state,
      action: PayloadAction<{
        pixelId: number;
        paused: boolean;
      }>
    ) {
      const { pixelId, paused } = action.payload;
      const stats = state.entities[pixelId];
      if (stats) {
        stats.paused = paused;
      }
    },
  },
});

export const {
  resetDiceStats,
  addDieRoll,
  removeDieSession,
  setDieSessionPaused,
} = DiceStatsSlice.actions;
export default DiceStatsSlice.reducer;
