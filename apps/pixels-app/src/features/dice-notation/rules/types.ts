import type { RollConfig } from "../util/rollConfig";

export interface Plugins {
  [key: string]: DiceRule<any>;
}

export interface DiceRule<T> {
  regex: RegExp;
  typeConstant: string;
  tokenize: (raw: string, config: RollConfig) => T;
  roll: (token: T, config: RollConfig) => Rolls;
  calculateValue: (token: T, rolls: number[], config: RollConfig) => number;
}

export type Rolls = number[];

export type RollResults = (Rolls | null)[];
