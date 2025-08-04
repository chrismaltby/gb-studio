import {
  isFunctionSymbol,
  isNumeric,
  toNumber,
  isOperatorSymbol,
  isVariable,
  isConstant,
} from "./helpers";
import { Token } from "./types";

const identity = <T>(i: T): T => i;

const tokenizer = (input: string): Token[] => {
  return (
    input
      .replace(/\s+/g, "")
      .split(
        /(@[a-f0-9-]{36}@|<<|>>|==|!=|>=|>|<=|<|&&|\|\||[+\-*/^%&|~!@(),])/,
      )
      .filter(identity)
      .map((token): Token => {
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
        if (isVariable(token)) {
          return {
            type: "VAR",
            symbol: token,
          };
        }
        if (isConstant(token)) {
          return {
            type: "CONST",
            symbol: token.replaceAll(/@/g, ""),
          };
        }
        throw new Error(`Unexpected token ${token}`);
      })
      .filter(identity) as Token[]
  )
    .map((token, i, tokens): Token[] => {
      // Handle unary negation
      if (token.type === "OP" && token.operator === "-") {
        if (i === 0) {
          return [
            {
              type: "VAL",
              value: 0,
            },
            {
              type: "OP",
              operator: "-",
            },
          ];
        }
        const previous = tokens[i - 1];
        if (
          previous.type === "LBRACE" ||
          (previous.type === "OP" && isOperatorSymbol(previous.operator))
        ) {
          return [
            {
              type: "VAL",
              value: 0,
            },
            {
              type: "OP",
              operator: "-",
            },
          ];
        }
      }
      return [token];
    })
    .flat();
};

export default tokenizer;
