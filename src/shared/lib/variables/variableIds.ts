export const normalizeVariableId = (variableId: string): string =>
  /^\d+$/.test(variableId) ? String(Number(variableId)) : variableId;
