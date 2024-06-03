import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

export interface DieSession {
  index: number;
  startTime: number; // Timestamp
  endTime: number; // Timestamp
  rolls: number[];
}

export type DieSessionsState = EntityState<DieSession>;

export const sessionsAdapter = createEntityAdapter({
  selectId: (dieSession: DieSession) => dieSession.index,
});

export interface DieStats {
  pixelId: number;
  lastRolls: number[];
  sessions: DieSessionsState;
  lastUsedSessionIndex: number; // Session with this index might have been removed
  forceNewSession: boolean;
}

export type DiceStatsState = EntityState<DieStats>;

export const diceStatsAdapter = createEntityAdapter({
  selectId: (dieStats: DieStats) => dieStats.pixelId,
});

function log(
  action:
    | "resetDiceStats"
    | "addDieRoll"
    | "removeDieSession"
    | "newDieSessionOnRoll"
) {
  logWrite(action);
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
        lastUsedSessionIndex: 0,
        forceNewSession: false,
      };

      // Store roll
      if (stats.lastRolls.length > 10) {
        stats.lastRolls.shift();
      }
      stats.lastRolls.push(roll);

      // Continue last session if within 4 hours or if time is older than last session
      const now = Date.now();
      const lastSession =
        stats.sessions.entities[
          stats.sessions.ids[stats.sessions.ids.length - 1]
        ];
      const sessionMaxDuration = 4 * 60 * 60 * 1000;
      const newSession =
        stats.forceNewSession ||
        !lastSession ||
        now - lastSession.endTime > sessionMaxDuration;
      if (newSession) {
        stats.lastUsedSessionIndex++;
      }
      const session = newSession
        ? {
            index: stats.lastUsedSessionIndex,
            startTime: now,
            endTime: now,
            rolls: [],
          }
        : lastSession;

      // Update session
      session.rolls.push(roll);
      session.endTime = now;
      if (newSession) {
        stats.sessions = sessionsAdapter.addOne(stats.sessions, session);
        stats.forceNewSession = false;
      }
      return diceStatsAdapter.setOne(state, stats);
    },

    newDieSessionOnRoll(state, action: PayloadAction<{ pixelId: number }>) {
      log("newDieSessionOnRoll");
      const { pixelId } = action.payload;
      const stats = state.entities[pixelId];
      if (stats) {
        stats.forceNewSession = true;
      }
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
        if (index === stats.sessions.ids[stats.sessions.ids.length - 1]) {
          stats.forceNewSession = true;
        }
        sessionsAdapter.removeOne(stats.sessions, index);
      }
    },
  },
});

export const {
  resetDiceStats,
  addDieRoll,
  newDieSessionOnRoll,
  removeDieSession,
} = DiceStatsSlice.actions;
export default DiceStatsSlice.reducer;
