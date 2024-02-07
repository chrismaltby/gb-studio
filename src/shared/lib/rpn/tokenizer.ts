import {
  isFunctionSymbol,
  isNumeric,
  toNumber,
  isOperatorSymbol,
  isVariable,
} from "./helpers";
import { Token } from "./types";

const identity = <T>(i: T): T => i;

const tokenizer = (input: string): Token[] => {
  return (
    input
      .replace(/\s+/g, "")
      .split(/(==|!=|>=|>|<=|<|&&|\|\||[+\-*/^%&|~@(),])/)
      .filter(identity)
      .map((token) => {
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
              operator: "u",
            },
          ];
        }
      }
      return [token];
    })
    .flat();
};

export default tokenizer;
