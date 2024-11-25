import { Operator } from "./operators";
import { CONSTANT } from "./rules/constant";
import { SimpleDiceRollToken, SIMPLE_DIE_ROLL } from "./rules/simpleDieRoll";

export enum CoreTokenTypes {
  OpenParen = "OpenParen",
  CloseParen = "CloseParen",
  Operator = "Operator",
  DiceRoll = "DiceRoll",
}

export interface BaseToken {
  type: CoreTokenTypes;
  position: number;
  content: string;
}

export interface OpenParenToken extends BaseToken {
  type: CoreTokenTypes.OpenParen;
}

export interface CloseParenToken extends BaseToken {
  type: CoreTokenTypes.CloseParen;
}

export interface OperatorToken extends BaseToken {
  type: CoreTokenTypes.Operator;
  operator: Operator;
}

export interface DiceRollToken<T = any> extends BaseToken {
  type: CoreTokenTypes.DiceRoll;
  detailType: string;
  detail: T;
}

export interface ErrorToken {
  type: "error";
  position: number;
  content: string;
}

export type Token =
  | OpenParenToken
  | CloseParenToken
  | OperatorToken
  | DiceRollToken;

// Token builders used for constructing test data
export const openParenToken = (
  position: number,
  content: string
): OpenParenToken => ({
  type: CoreTokenTypes.OpenParen,
  position,
  content,
});

export const closeParenToken = (
  position: number,
  content: string
): CloseParenToken => ({
  type: CoreTokenTypes.CloseParen,
  position,
  content,
});

export const operatorToken = (
  operator: Operator,
  position: number,
  content: string
): OperatorToken => ({
  type: CoreTokenTypes.Operator,
  position,
  content,
  operator,
});

export const diceRollToken = (
  count: number,
  numSides: number,
  position: number,
  content: string
): DiceRollToken<SimpleDiceRollToken> => ({
  type: CoreTokenTypes.DiceRoll,
  position,
  content,
  detailType: SIMPLE_DIE_ROLL,
  detail: { count, numSides },
});

export const constantToken = (
  value: number,
  position: number,
  content: string
): DiceRollToken<number> => ({
  type: CoreTokenTypes.DiceRoll,
  position,
  content,
  detailType: CONSTANT,
  detail: value,
});

export const errorToken = (position: number, content: string): ErrorToken => ({
  type: "error",
  position,
  content,
});
