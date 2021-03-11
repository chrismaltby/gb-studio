export const operatorSymbols = [
  "/",
  "*",
  "+",
  "-",
  "%",
  "&",
  "|",
  "^",
  "~",
  "u",
  "==",
  "!=",
  "<",
  "<=",
  ">",
  ">=",
  "&&",
  "||",
] as const;
export type OperatorSymbol = typeof operatorSymbols[number];

export const functionSymbols = ["min", "max", "abs"] as const;
export type FunctionSymbol = typeof functionSymbols[number];

export const functionArgsLen: Record<FunctionSymbol, number> = {
  min: 2,
  max: 2,
  abs: 1,
};

export enum Associativity {
  Left,
  Right,
}

interface TokenLBrace {
  type: "LBRACE";
}

interface TokenRBrace {
  type: "RBRACE";
}

interface TokenSeperator {
  type: "SEPERATOR";
}

interface TokenVal {
  type: "VAL";
  value: number;
}

interface TokenVar {
  type: "VAR";
  symbol: string;
}

interface TokenFunction {
  type: "FUN";
  function: FunctionSymbol;
}

interface TokenOperator {
  type: "OP";
  operator: OperatorSymbol;
}

export type Token =
  | TokenVal
  | TokenVar
  | TokenLBrace
  | TokenRBrace
  | TokenFunction
  | TokenOperator
  | TokenSeperator;
