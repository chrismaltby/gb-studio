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
  "!",
  "==",
  "!=",
  "<",
  "<=",
  ">",
  ">=",
  "&&",
  "||",
  "<<",
  ">>",
  "neg",
] as const;
export type OperatorSymbol = (typeof operatorSymbols)[number];

export const functionSymbols = [
  "min",
  "max",
  "abs",
  "atan2",
  "isqrt",
  "rnd",
  "neg",
] as const;
export type FunctionSymbol = (typeof functionSymbols)[number];

export const functionArgsLen: Record<FunctionSymbol, number> = {
  min: 2,
  max: 2,
  abs: 1,
  atan2: 2,
  isqrt: 1,
  rnd: 1,
  neg: 1,
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

interface TokenConst {
  type: "CONST";
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
  | TokenConst
  | TokenLBrace
  | TokenRBrace
  | TokenFunction
  | TokenOperator
  | TokenSeperator;

export type RPNToken =
  | TokenVal
  | TokenVar
  | TokenConst
  | TokenFunction
  | TokenOperator;

const rpnTokenTypes = ["VAL", "VAR", "FUN", "OP"] as const;

export const isRPNToken = (token: Token): token is RPNToken => {
  return rpnTokenTypes.includes(token.type as (typeof rpnTokenTypes)[number]);
};

const operatorArgsLen: Record<OperatorSymbol, number> = {
  "/": 2,
  "*": 2,
  "+": 2,
  "-": 2,
  "%": 2,
  "&": 2,
  "|": 2,
  "^": 2,
  "~": 1,
  "!": 1,
  "==": 2,
  "!=": 2,
  "<": 2,
  "<=": 2,
  ">": 2,
  ">=": 2,
  "&&": 2,
  "||": 2,
  "<<": 2,
  ">>": 2,
  neg: 1,
};

export const getOperatorArgsLen = (operator: OperatorSymbol): number => {
  return operatorArgsLen[operator];
};
