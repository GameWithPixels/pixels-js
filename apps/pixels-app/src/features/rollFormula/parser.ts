import { RollFormulaTree } from "./rollFormula";
import { formulaTokenizer, Token } from "./tokenizer";

export class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParserError";
  }
}

export class Parser {
  private _input: Token[];
  private _pos = 0;

  constructor(tokens: Token[]) {
    this._input = tokens;
  }

  expression(): RollFormulaTree {
    return this._additiveExpression();
  }

  private _getNext(): Token {
    return this._input[this._pos++];
  }

  private _peekNext(): Token {
    return this._input[this._pos];
  }

  private _skipNext(): void {
    ++this._pos;
  }

  private _additiveExpression(): RollFormulaTree {
    let expr = this._multiplicativeExpression();
    let tok = this._peekNext();
    while (
      tok?.type === "operator" &&
      (tok.operator === "+" || tok.operator === "-")
    ) {
      this._skipNext();
      expr = {
        kind: "operation",
        operator: tok.operator,
        left: expr,
        right: this._multiplicativeExpression(),
      };
      tok = this._peekNext();
    }
    return expr;
  }

  private _multiplicativeExpression(): RollFormulaTree {
    let expr = this._modifierExpression();
    let tok = this._peekNext();
    while (
      tok?.type === "operator" &&
      (tok.operator === "*" || tok.operator === "/")
    ) {
      this._skipNext();
      expr = {
        kind: "operation",
        operator: tok.operator,
        left: expr,
        right: this._modifierExpression(),
      };
      tok = this._peekNext();
    }
    return expr;
  }

  private _modifierExpression(): RollFormulaTree {
    let expr = this._primaryExpressionOrList();
    const tok = this._peekNext();
    if (tok?.type === "modifier") {
      this._skipNext();
      if (Array.isArray(expr) || expr.kind === "dice") {
        expr = {
          kind: "modifier",
          modifier: tok.modifier,
          count: tok.count,
          groups: Array.isArray(expr) ? expr : [expr],
        };
      } else {
        throw new ParserError("Modifier must be applied to a dice roll");
      }
    }
    if (Array.isArray(expr)) {
      throw new ParserError("Expected a single expression, got a list");
    }
    return expr;
  }

  private _primaryExpressionOrList(): RollFormulaTree | RollFormulaTree[] {
    let tok = this._getNext();
    if (tok?.type === "constant") {
      return {
        kind: "constant",
        value: tok.value,
      };
    } else if (tok?.type === "dice") {
      return {
        kind: "dice",
        count: tok.count,
        dieType: tok.dieType,
      };
    } else if (tok?.type === "grouping" && tok.operator === "(") {
      const node = this.expression();
      tok = this._getNext();
      if (tok?.type !== "grouping" || tok.operator !== ")") {
        throw new ParserError("Closing parenthesis expected");
      }
      return node;
    } else if (tok?.type === "grouping" && tok.operator === "{") {
      const nodes = [this.expression()];
      let tok = this._getNext();
      while (tok?.type === "operator" && tok.operator === ",") {
        nodes.push(this.expression());
        tok = this._getNext();
      }
      if (tok?.type !== "grouping" || tok.operator !== "}") {
        throw new ParserError("Closing bracket expected");
      }
      return nodes;
    } else throw new ParserError(`Unexpected token ${tok?.type}`);
  }
}

export function parseRollFormula(formula: string): RollFormulaTree {
  return new Parser(formulaTokenizer(formula.toLowerCase())).expression();
}
