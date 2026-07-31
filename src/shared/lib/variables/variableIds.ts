export const normalizeVariableId = (variableId: string): string => {
  if (!/^\d+$/.test(variableId)) {
    return variableId;
  }
  return variableId.replace(/^0+(?=\d)/, "");
};
