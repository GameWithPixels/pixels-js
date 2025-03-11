import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import moo from "moo";

import {
  RollGroupingOperator,
  RollOperator,
  RollDieType,
  RollDieTypeValues,
  RollModifier,
  RollModifierValues,
} from "./types";

const LexerRules = {
  whiteSpace: /[ \t]+/,
  operator: /\+|-|\*|\/|,/,
  grouping: /\(|\)|\{|\}/,
  // Order is important
  modifier: /[kd][hl]\d*/,
  dice: /\d*d(?:\d+|F)/,
  constant: /\d+/,
} as const;

export type TokenType = keyof typeof LexerRules;

export interface BaseToken {
  type: TokenType;
  position: number;
  content: string;
}

export interface OperatorToken extends BaseToken {
  type: "operator";
  operator: RollOperator;
}

export interface GroupingOperatorToken extends BaseToken {
  type: "grouping";
  operator: RollGroupingOperator;
}

export interface ConstantToken extends BaseToken {
  type: "constant";
  value: number;
}

export interface DiceToken extends BaseToken {
  type: "dice";
  dieType: RollDieType;
  count: number;
}

export interface ModifierToken extends BaseToken {
  type: "modifier";
  modifier: RollModifier;
  count: number;
}

export type Token =
  | OperatorToken
  | GroupingOperatorToken
  | ConstantToken
  | DiceToken
  | ModifierToken;

export interface ErrorToken {
  type: "error";
  position: number;
  content: string;
}

export type Rolls = number[];

export type RollResults = (Rolls | null)[];

export type Tokenizer = (notation: string) => Token[];

export type FaultTolerantTokenizer = (notation: string) => {
  tokens: Token[];
  error: ErrorToken | null;
};

function parseNumber(str: string, defaultValue = 0): number {
  if (!str) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error("Empty number string");
  }
  const i = parseInt(str, 10);
  assert(!isNaN(i), `Failed to parse number: ${str}`);
  return i;
}

function parseDieType(str: string): RollDieType {
  if (str === "dF") {
    return "d6fudge";
  } else {
    const dt = str as RollDieType;
    assert(
      dt !== "d6fudge" && RollDieTypeValues[dt],
      `Failed to parse die type: ${str}`
    );
    return dt;
  }
}

function parseModifier(str: string): RollModifier {
  const mod = str as RollModifier;
  assert(RollModifierValues[mod], `Failed to parse modifier: ${str}`);
  return mod;
}

function processToken(token: moo.Token): Token {
  const type = token.type as TokenType;
  const position = token.col - 1;
  const content = token.value;
  switch (type) {
    case "operator":
      return {
        type,
        position,
        content,
        operator: content as RollOperator,
      };

    case "grouping":
      return {
        type,
        position,
        content,
        operator: content as RollGroupingOperator,
      };

    case "constant":
      if (!content) {
        throw new Error("Invalid modifier token");
      }
      return {
        type,
        position,
        content,
        value: parseNumber(content),
      };

    case "dice": {
      const parts = content.split("d");
      if (parts.length !== 2) {
        throw new Error("Invalid dice token");
      }
      return {
        type,
        position,
        content,
        dieType: parseDieType("d" + parts[1]),
        count: parseNumber(parts[0], 1),
      };
    }

    case "modifier": {
      if (content.length < 2) {
        throw new Error("Invalid modifier token");
      }
      return {
        type,
        position,
        content,
        modifier: parseModifier(content.slice(0, 2)),
        count: parseNumber(content.slice(2), 1),
      };
    }

    case "whiteSpace":
      throw new Error("Unexpected whitespace token");

    default:
      assertNever(type, `Unrecognized token type: ${type}`);
  }
}

// Cache the lexer to avoid recompiling it on every call
let lexer: moo.Lexer;
let faultTolerantLexer: moo.Lexer;

export function formulaTokenizer(notation: string): Token[] {
  lexer ??= moo.compile(LexerRules);
  lexer.reset(notation);
  return Array.from(lexer)
    .filter((token) => token.type !== "whiteSpace")
    .map((token) => processToken(token));
}

export function faultTolerantFormulaTokenizer(notation: string): {
  tokens: Token[];
  error: ErrorToken | null;
} {
  faultTolerantLexer ??= moo.compile({
    ...LexerRules,
    error: moo.error,
  });
  faultTolerantLexer.reset(notation);
  const allTokens = Array.from(faultTolerantLexer);
  const tokens = allTokens
    .filter(
      (token) => token.type && !["whiteSpace", "error"].includes(token.type)
    )
    .map((token) => processToken(token));
  const lastToken = allTokens[allTokens.length - 1];
  const error =
    lastToken?.type === "error"
      ? ({
          type: "error",
          position: lastToken.col - 1,
          content: lastToken.text,
        } as ErrorToken)
      : null;
  return { tokens, error };
}
