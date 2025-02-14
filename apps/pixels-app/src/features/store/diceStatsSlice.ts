import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

export type DieSession = {
  index: number;
  startTime: number; // Timestamp of first roll, or if none, of session creation
  endTime: number; // Timestamp of last roll, or if none, of session creation
  rolls: number[];
};

export type DieSessionsState = EntityState<DieSession>;

export const sessionsAdapter = createEntityAdapter({
  selectId: (dieSession: Readonly<DieSession>) => dieSession.index,
});

export type DieStats = {
  pixelId: number;
  lastRolls: number[]; // The last few rolls
  sessions: DieSessionsState;
  paused: boolean;
};

export type DiceStatsState = EntityState<DieStats>;

export const diceStatsAdapter = createEntityAdapter({
  selectId: (dieStats: DieStats) => dieStats.pixelId,
});

// Sessions will stop after 4 hours of inactivity
const sessionMaxInactivityDuration = 4 * 60 * 60 * 1000; // In milliseconds

function log(
  action:
    | "resetDiceStats"
    | "addDieRoll"
    | "newDieSession"
    | "mergeDieSessions"
    | "removeDieSession"
    | "removeDieSessionLastRoll"
    | "setDieSessionPaused",
  payload?: unknown
) {
  logWrite(payload ? `${action}, payload: ${JSON.stringify(payload)}` : action);
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

function addSession(stats: DieStats, startTime: number): DieSession {
  const lastSession = stats.sessions.entities[stats.sessions.ids.at(-1) ?? -1];
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
  initialState: diceStatsAdapter.getInitialState,
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
      log("addDieRoll", action.payload);
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
        // Continue last session if empty or not passed the inactivity duration
        let session = stats.sessions.entities[stats.sessions.ids.at(-1) ?? -1];
        if (
          !session ||
          (session.rolls.length &&
            now - session.endTime > sessionMaxInactivityDuration)
        ) {
          session = addSession(stats, now);
        }
        // Update start and end time
        if (!session.rolls.length) {
          session.startTime = now;
        }
        session.endTime = now;
        // Add roll to session
        session.rolls.push(roll);
      }

      return newState;
    },

    newDieSession(
      state,
      action: PayloadAction<{
        pixelId: number;
        onlyIfNoSession?: boolean;
      }>
    ) {
      log("newDieSession");
      const { pixelId } = action.payload;
      const { state: newState, stats } = getOrCreateStats(state, pixelId);
      addSession(stats, Date.now());
      return newState;
    },

    mergeDieSessions(
      state,
      action: PayloadAction<{
        pixelId: number;
        index1: number;
        index2: number;
      }>
    ) {
      log("mergeDieSessions");
      const stats = state.entities[action.payload.pixelId];
      // Make sure index1 < index2
      const index1 = Math.min(action.payload.index1, action.payload.index2);
      const index2 = Math.max(action.payload.index1, action.payload.index2);
      const s1 = stats?.sessions.entities[index1];
      const s2 = stats?.sessions.entities[index2];
      if (s1 && s2 && s1 !== s2) {
        // Merge sessions
        s1.rolls.push(...s2.rolls);
        s1.endTime = Math.max(s1.endTime, s2.endTime);
        sessionsAdapter.removeOne(stats.sessions, index2);
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
  newDieSession,
  mergeDieSessions,
  removeDieSession,
  removeDieSessionLastRoll,
  setDieSessionPaused,
} = DiceStatsSlice.actions;
export default DiceStatsSlice.reducer;
