type DebuggerVariable = {
  name?: string;
  symbol: string;
  length?: number;
  offset?: number;
};

export type DebuggerVariableRow<T extends DebuggerVariable> = T & {
  arrayIndex: number;
  displayName: string;
  displaySymbol: string;
  value: number | undefined;
};

export const expandDebuggerVariables = <T extends DebuggerVariable>(
  variableSymbols: string[],
  variableDataBySymbol: Record<string, T>,
  variablesData: number[],
): DebuggerVariableRow<T>[] => {
  let fallbackOffset = 0;

  return variableSymbols.flatMap((symbol) => {
    const variable = variableDataBySymbol[symbol];
    if (!variable) {
      return [];
    }

    const length = Math.max(1, Math.floor(variable.length ?? 1));
    const offset = variable.offset ?? fallbackOffset;
    fallbackOffset = Math.max(fallbackOffset, offset + length);
    const name = variable.name ?? variable.symbol;

    return Array.from({ length }, (_, arrayIndex) => ({
      ...variable,
      arrayIndex,
      displayName: length > 1 ? `${name}[${arrayIndex}]` : name,
      displaySymbol:
        length > 1 ? `${variable.symbol}[${arrayIndex}]` : variable.symbol,
      value: variablesData[offset + arrayIndex],
    }));
  });
};
