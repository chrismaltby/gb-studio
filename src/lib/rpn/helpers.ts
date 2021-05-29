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
  return (
    str.toLowerCase() === "true" ||
    str.toLowerCase() === "false" ||
    (!isNaN(Number(str)) && isFinite(Number(str)))
  );
};

export const toNumber = (str: string) => {
  if (str.toLowerCase() === "true") {
    return 1;
  }
  if (str.toLowerCase() === "false") {
    return 0;
  }
  return Number(str);
};

export const isOperatorSymbol = (x: string): x is OperatorSymbol => {
  return (operatorSymbols as unknown as string[]).indexOf(x) > -1;
};

export const isFunctionSymbol = (x: string): x is FunctionSymbol => {
  return (functionSymbols as unknown as string[]).indexOf(x) > -1;
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
      case "u":
      case "~":
        return 14;
      case "*":
      case "/":
      case "%":
        return 12;
      case "+":
      case "-":
        return 11;
      case "<":
      case ">":
      case ">=":
      case "<=":
        return 9;
      case "==":
      case "!=":
        return 8;
      case "&":
        return 7;
      case "^":
        return 6;
      case "|":
        return 5;
      case "&&":
        return 4;
      case "||":
        return 3;
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

const assertUnreachable = (_x: never): never => {
  throw new Error("Didn't expect to get here");
};
