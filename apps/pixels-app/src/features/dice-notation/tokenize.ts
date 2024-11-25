import * as moo from "moo";

import { Operator } from "./operators";
import { Plugins } from "./rules/types";
import { CoreTokenTypes, ErrorToken, Token } from "./tokens";
import {
  getFinalRollConfig,
  RollConfig,
  RollConfigOptions,
} from "./util/rollConfig";

const WHITE_SPACE = "WHITE_SPACE";

interface LexerRules {
  [type: string]: string | RegExp;
}

export type Tokenize = (
  notation: string,
  configOverrides?: Partial<RollConfigOptions>
) => Token[];

export type TokenizeFaultTolerant = (
  notation: string,
  configOverrides?: Partial<RollConfigOptions>
) => { tokens: Token[]; error: ErrorToken | null };

function createTokenize(
  plugins: Plugins,
  rollConfig: RollConfigOptions
): { tokenize: Tokenize; tokenizeFaultTolerant: TokenizeFaultTolerant } {
  const rules: LexerRules = {
    [WHITE_SPACE]: /[ \t]+/,
    [CoreTokenTypes.Operator]: /\*|\/|\+|-/,
    [CoreTokenTypes.OpenParen]: "(",
    [CoreTokenTypes.CloseParen]: ")",
  };

  Object.values(plugins).forEach((plugin) => {
    rules[plugin.typeConstant] = plugin.regex;
  });

  const lexer = moo.compile(rules);
  const faultTolerantLexer = moo.compile({
    ...rules,
    error: moo.error,
  });

  function tokenize(
    notation: string,
    configOverrides?: Partial<RollConfigOptions>
  ): Token[] {
    const finalConfig = getFinalRollConfig(rollConfig, configOverrides);
    lexer.reset(notation);
    return Array.from(lexer)
      .filter((token) => token.type !== WHITE_SPACE)
      .map((token) => processToken(token, finalConfig));
  }

  function tokenizeFaultTolerant(
    notation: string,
    configOverrides?: Partial<RollConfigOptions>
  ): { tokens: Token[]; error: ErrorToken | null } {
    const finalConfig = getFinalRollConfig(rollConfig, configOverrides);
    faultTolerantLexer.reset(notation);
    const allTokens = Array.from(faultTolerantLexer);
    const tokens = allTokens
      .filter(
        (token) => token.type && ![WHITE_SPACE, "error"].includes(token.type)
      )
      .map((token) => processToken(token, finalConfig));
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

  /**
   * Take a moo token and turn it into a dice-notation token.
   * @param token the moo token
   */
  function processToken(token: moo.Token, config: RollConfig): Token {
    if (!token.type) throw new Error("Unrecognized token");

    switch (token.type) {
      case CoreTokenTypes.Operator:
        return {
          type: CoreTokenTypes.Operator,
          position: token.col - 1,
          content: token.value,
          operator: token.value as Operator,
        };
      case CoreTokenTypes.OpenParen:
        return {
          type: CoreTokenTypes.OpenParen,
          position: token.col - 1,
          content: token.value,
        };
      case CoreTokenTypes.CloseParen:
        return {
          type: CoreTokenTypes.CloseParen,
          position: token.col - 1,
          content: token.value,
        };
      default: {
        const rule = plugins[token.type];
        if (!rule) throw new Error(`Unrecognized token of type ${token.type}`);
        return {
          type: CoreTokenTypes.DiceRoll,
          content: token.value,
          position: token.col - 1,
          detailType: rule.typeConstant,
          detail: rule.tokenize(token.value, config),
        };
      }
    }
  }

  return { tokenize, tokenizeFaultTolerant };
}

export default createTokenize;
