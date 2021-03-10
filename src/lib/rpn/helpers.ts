import {
  Associativity,
  FunctionSymbol,
  functionSymbols,
  OperatorSymbol,
  operatorSymbols,
  functionArgsLen,
  Token,
} from "./types";

export const isNumeric = (str: string) => {
  return !isNaN(Number(str)) && isFinite(Number(str));
};

export const isOperatorSymbol = (x: string): x is OperatorSymbol => {
  return ((operatorSymbols as unknown) as string[]).indexOf(x) > -1;
};

export const isFunctionSymbol = (x: string): x is FunctionSymbol => {
  return ((functionSymbols as unknown) as string[]).indexOf(x) > -1;
};

export const isVariable = (token: string): boolean => {
  return !!/^[$A-Z_][0-9A-Z_$]*$/i.exec(token);
};

export const getPrecedence = (token: Token): number => {
  if (token.type === "FUN") {
    return 4;
  }
  if (token.type === "OP") {
    switch (token.operator) {
      case "~":
        return 1;
      case "+":
      case "-":
        return 2;
      case "*":
      case "/":
      case "%":
      case "&":
        return 3;
      case "^":
        return 4;
      case "|":
      case "u":
        return 5;
    }
    assertUnreachable(token.operator);
  }
  return -1;
};

export const getAssociativity = (token: Token): Associativity => {
  if (token.type === "OP" && token.operator === "u") {
    return Associativity.Right;
  }
  return Associativity.Left;
};

export const getArgsLen = (symbol: FunctionSymbol) => {
  return functionArgsLen[symbol];
};

const assertUnreachable = (x: never): never => {
  throw new Error("Didn't expect to get here");
};
