import {
  isConstant,
  isFunctionSymbol,
  isNumeric,
  isOperatorSymbol,
  isVariable,
  toNumber,
} from "./helpers";
import { Token } from "./types";

const multiCharacterOperators = [
  "<<",
  ">>",
  "==",
  "!=",
  ">=",
  "<=",
  "&&",
  "||",
];
const singleCharacterTokens = new Set("+-*/^%&|~!(),<>");

const readDelimitedToken = (
  input: string,
  offset: number,
  delimiter: "$" | "@",
): number => {
  const end = input.indexOf(delimiter, offset + 1);
  if (end === -1) {
    throw new Error(`Unterminated ${delimiter} token`);
  }
  return end + 1;
};

const readVariableToken = (
  input: string,
  offset: number,
): { token: string; end: number; indexExpression?: string } => {
  const symbolEnd = readDelimitedToken(input, offset, "$");
  if (input[symbolEnd] !== "[") {
    return {
      token: input.slice(offset, symbolEnd),
      end: symbolEnd,
    };
  }

  let depth = 1;
  let cursor = symbolEnd + 1;
  while (cursor < input.length && depth > 0) {
    if (input[cursor] === "[") {
      depth++;
    } else if (input[cursor] === "]") {
      depth--;
    }
    cursor++;
  }
  if (depth !== 0) {
    throw new Error("Unterminated array index");
  }

  const indexExpression = input.slice(symbolEnd + 1, cursor - 1);
  if (!indexExpression) {
    throw new Error("Array index cannot be empty");
  }

  return {
    token: input.slice(offset, cursor),
    end: cursor,
    indexExpression,
  };
};

const splitTokens = (
  input: string,
): Array<{ token: string; indexExpression?: string }> => {
  const tokens: Array<{ token: string; indexExpression?: string }> = [];
  let offset = 0;

  while (offset < input.length) {
    if (input[offset] === "$") {
      const variable = readVariableToken(input, offset);
      tokens.push({
        token: variable.token,
        indexExpression: variable.indexExpression,
      });
      offset = variable.end;
      continue;
    }
    if (input[offset] === "@") {
      const end = readDelimitedToken(input, offset, "@");
      tokens.push({ token: input.slice(offset, end) });
      offset = end;
      continue;
    }

    const multiCharacterOperator = multiCharacterOperators.find((operator) =>
      input.startsWith(operator, offset),
    );
    if (multiCharacterOperator) {
      tokens.push({ token: multiCharacterOperator });
      offset += multiCharacterOperator.length;
      continue;
    }

    if (singleCharacterTokens.has(input[offset])) {
      tokens.push({ token: input[offset] });
      offset++;
      continue;
    }

    let end = offset + 1;
    while (
      end < input.length &&
      input[end] !== "$" &&
      input[end] !== "@" &&
      !singleCharacterTokens.has(input[end]) &&
      !multiCharacterOperators.some((operator) =>
        input.startsWith(operator, end),
      )
    ) {
      end++;
    }
    tokens.push({ token: input.slice(offset, end) });
    offset = end;
  }

  return tokens;
};

const tokenizer = (input: string): Token[] => {
  const tokens = splitTokens(input.replace(/\s+/g, "")).map(
    ({ token, indexExpression }): Token => {
      if (isNumeric(token)) {
        return {
          type: "VAL",
          value: toNumber(token),
        };
      }
      if (isFunctionSymbol(token)) {
        return {
          type: "FUN",
          function: token,
        };
      }
      if (token === "(") {
        return {
          type: "LBRACE",
        };
      }
      if (token === ")") {
        return {
          type: "RBRACE",
        };
      }
      if (token === ",") {
        return {
          type: "SEPERATOR",
        };
      }
      if (isOperatorSymbol(token)) {
        return {
          type: "OP",
          operator: token,
        };
      }
      const variableSymbol = token.replace(/\[.*\]$/s, "");
      if (isVariable(variableSymbol)) {
        return {
          type: "VAR",
          symbol: variableSymbol,
          ...(indexExpression !== undefined && {
            index: tokenizer(indexExpression),
          }),
        };
      }
      if (isConstant(token)) {
        return {
          type: "CONST",
          symbol: token.replaceAll(/@/g, ""),
        };
      }
      throw new Error(`Unexpected token ${token}`);
    },
  );

  return tokens
    .map((token, i): Token[] => {
      if (token.type === "OP" && token.operator === "-") {
        if (i === 0) {
          return [
            {
              type: "OP",
              operator: "neg",
            },
          ];
        }
        const previous = tokens[i - 1];
        if (
          previous.type === "LBRACE" ||
          previous.type === "SEPERATOR" ||
          previous.type === "OP"
        ) {
          return [
            {
              type: "OP",
              operator: "neg",
            },
          ];
        }
      }
      return [token];
    })
    .flat();
};

export default tokenizer;
