import {
  PixelDieType,
  PixelDieTypeValues,
} from "@systemic-games/pixels-core-animation";
import {
  assert,
  assertNever,
  enumValue,
} from "@systemic-games/pixels-core-utils";
import moo from "moo";

export type RollDieType = Exclude<PixelDieType, "unknown" | "d6pipped">;

export const OperatorValues = {
  "+": enumValue(),
  "-": enumValue(),
  "*": enumValue(),
  "/": enumValue(),
  ",": enumValue(),
} as const;

export type Operator = keyof typeof OperatorValues;

export const GroupingOperatorValues = {
  "(": enumValue(),
  ")": enumValue(),
  "{": enumValue(),
  "}": enumValue(),
} as const;

export type GroupingOperator = keyof typeof GroupingOperatorValues;

// https://wiki.roll20.net/Dice_Reference#Roll_Modifiers
export const RollModifierValues = {
  kh: enumValue(),
  kl: enumValue(),
  dh: enumValue(),
  dl: enumValue(),
} as const;

export type RollModifier = keyof typeof RollModifierValues;

const LexerRules = {
  whiteSpace: /[ \t]+/,
  operator: /\+|-|\*|\/|,/,
  grouping: /\(|\)|\{|\}/,
  // Order is important
  modifier: /[kd][hl]\d*/,
  dice: /\d+d(?:\d+|F)/,
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
  operator: Operator;
}

export interface GroupingOperatorToken extends BaseToken {
  type: "grouping";
  operator: GroupingOperator;
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

function parseNumber(str: string): number {
  const i = parseInt(str, 10);
  assert(!isNaN(i), `Failed to parse number: ${str}`);
  return i;
}

function parseDieType(str: string): RollDieType {
  if (str === "dF") {
    return "d6fudge";
  } else {
    const dt = str as PixelDieType;
    assert(
      dt !== "unknown" &&
        dt !== "d6pipped" &&
        dt !== "d6fudge" &&
        PixelDieTypeValues[dt],
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
        operator: token.value as Operator,
      };

    case "grouping":
      return {
        type,
        position,
        content,
        operator: token.value as GroupingOperator,
      };

    case "constant":
      return {
        type,
        position,
        content,
        value: parseNumber(token.value),
      };

    case "dice": {
      const [count, numSides] = token.value.split("d");
      return {
        type,
        position,
        content,
        dieType: parseDieType("d" + numSides),
        count: parseNumber(count),
      };
    }

    case "modifier": {
      const modifier = parseModifier(token.value.slice(0, 2));
      const count = parseNumber(token.value.slice(2));
      return {
        type,
        position,
        content,
        modifier,
        count,
      };
    }

    case "whiteSpace":
      throw new Error("Unexpected whitespace token");

    default:
      assertNever(type, `Unrecognized token type: ${type}`);
  }
}

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
