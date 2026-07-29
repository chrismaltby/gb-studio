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
        /(\$(?:[VLT][0-9]|[a-f0-9-]{36}|[0-9]+)\$(?:\[(?:-?[0-9]+|\$(?:[VLT][0-9]|[a-f0-9-]{36}|[0-9]+)\$|@(?:[a-f0-9-]{36}|engine::[^@]+)@)\])?|@[a-f0-9-]{36}@|@engine::[^@]+@|<<|>>|==|!=|>=|>|<=|<|&&|\|\||[+\-*/^%&|~!@(),])/i,
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
          const [, symbol, index] =
            token.match(
              /^(\$(?:[VLT][0-9]|[a-z0-9-]{36}|[0-9]+)\$)(?:\[(-?[0-9]+|\$(?:[VLT][0-9]|[a-z0-9-]{36}|[0-9]+)\$|@(?:[a-z0-9-]{36}|engine::[^@]+)@)\])?$/i,
            ) ?? [];
          return {
            type: "VAR",
            symbol,
            ...(index !== undefined && {
              index: isNumeric(index)
                ? { type: "VAL" as const, value: toNumber(index) }
                : isConstant(index)
                  ? {
                      type: "CONST" as const,
                      symbol: index.replaceAll(/@/g, ""),
                    }
                  : { type: "VAR" as const, symbol: index },
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
      })
      .filter(identity) as Token[]
  )
    .map((token, i, tokens): Token[] => {
      // Handle unary negation
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
          (previous.type === "OP" && isOperatorSymbol(previous.operator))
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
