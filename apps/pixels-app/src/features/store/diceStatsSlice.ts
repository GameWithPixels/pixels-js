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

// Sessions will stop after 4 hours of inactivity
export const sessionMaxInactivityDuration = 4 * 60 * 60 * 1000; // In milliseconds

// Creates a new session object (not stored in the state)
export function createDieSession(index = 1, startTime = 0): DieSession {
  return {
    index,
    startTime,
    endTime: startTime,
    rolls: [],
  };
}

function log(
  action:
    | "resetDiceStats"
    | "addDieRoll"
    | "endDieLastSession"
    | "removeDieSession"
    | "removeDieSessionLastRoll"
    | "setDieSessionPaused"
) {
  logWrite(action);
}

function getOrCreateStats(state: DiceStatsState, pixelId: number) {
  let stats = state.entities[pixelId];
  if (!stats) {
    // Create new stats
    stats = {
      pixelId,
      lastRolls: [],
      sessions: sessionsAdapter.getInitialState(),
      paused: false,
    };
    state = diceStatsAdapter.setOne(state, stats);
  }
  return { state, stats };
}

function addSession(stats: DieStats, startTime = 0): DieSession {
  const lastSession = stats.sessions.entities[stats.sessions.ids.at(-1) ?? 0];
  const session = createDieSession((lastSession?.index ?? 0) + 1, startTime);
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

    // Session are lazy initialized, the first roll will start a new session
    addDieRoll(
      state,
      action: PayloadAction<{
        pixelId: number;
        roll: number;
      }>
    ) {
      log("addDieRoll");
      const { pixelId, roll } = action.payload;
      const { state: newState, stats } = getOrCreateStats(state, pixelId);

      // Store roll
      if (stats.lastRolls.length > 10) {
        stats.lastRolls.shift();
      }
      stats.lastRolls.push(roll);

      // Store roll in session if not paused
      if (!stats.paused) {
        const now = Date.now();
        // Continue last session if not passed "max idle delay"
        let session = stats.sessions.entities[stats.sessions.ids.at(-1) ?? 0];
        if (!session || now - session.endTime > sessionMaxInactivityDuration) {
          session = addSession(stats, now);
        }
        // Update start and end time
        if (!session.startTime || session.rolls.length === 0) {
          session.startTime = now;
        }
        session.endTime = now;
        // Add roll to session
        session.rolls.push(roll);
      }

      return newState;
    },

    endDieLastSession(
      state,
      action: PayloadAction<{
        pixelId: number;
      }>
    ) {
      log("endDieLastSession");
      const { pixelId } = action.payload;
      // Don't create stats if they do not exist
      const stats = state.entities[pixelId];
      const session = stats?.sessions.entities[stats.sessions.ids.at(-1) ?? 0];
      if (session && session.startTime > 0) {
        addSession(stats);
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
      // Don't create stats if they do not exist
      const stats = state.entities[pixelId];
      if (stats?.sessions.entities[index]) {
        sessionsAdapter.removeOne(stats.sessions, index);
      }
    },

    removeDieSessionLastRoll(
      state,
      action: PayloadAction<{
        pixelId: number;
        index: number;
      }>
    ) {
      log("removeDieSessionLastRoll");
      const { pixelId, index } = action.payload;
      // Don't create stats if the do not exist
      const session = state.entities[pixelId]?.sessions.entities[index];
      if (session?.rolls.length) {
        // Remove last roll
        session.rolls.pop();
        // Reset session if empty
        if (session.rolls.length) {
          session.startTime = 0;
          session.endTime = 0;
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
      log("setDieSessionPaused");
      const { pixelId, paused } = action.payload;
      const { state: newState, stats } = getOrCreateStats(state, pixelId);
      if (stats) {
        stats.paused = paused;
      }
      return newState;
    },
  },
});

export const {
  resetDiceStats,
  addDieRoll,
  endDieLastSession,
  removeDieSession,
  removeDieSessionLastRoll,
  setDieSessionPaused,
} = DiceStatsSlice.actions;
export default DiceStatsSlice.reducer;
