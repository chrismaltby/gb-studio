import { lexText, Token as TextToken } from "shared/lib/compiler/lexText";
import { Token as ExpressionToken } from "shared/lib/rpn/types";
import tokenizer from "shared/lib/rpn/tokenizer";

/**
 * Extracts a variable ID from a dialogue token by removing any leading zeros.
 * @param {TextToken} token - The token to process, expected to be of type 'variable'.
 * @returns {string | undefined} - The variable ID without leading zeros, or undefined if the token is not of type 'variable'.
 */
export const dialogueTokenToVariableId = (token: TextToken) =>
  token.type === "variable" ? token.variableId.replace(/^0/, "") : undefined;

/**
 * Extracts a variable ID from an expression token by removing dollar signs and any leading zeros.
 * @param {ExpressionToken} token - The token to process, expected to be of type 'VAR'.
 * @returns {string | undefined} - The variable ID without '$' symbols or leading zeros, or undefined if the token is not of type 'VAR'.
 */
export const expressionTokenToVariableId = (token: ExpressionToken) =>
  token.type === "VAR" && token.symbol.replace(/\$/g, "").replace(/^0/g, "");

/**
 * Checks if a given variable ID exists in a dialogue text input.
 * @param {string} variableId - The ID of the variable to search for in the text (without leading zeros).
 * @param {string} input - The dialogue text input to search within.
 * @returns {boolean} - True if the variable ID is found in the text, false otherwise.
 */
export const variableInDialogueText = (
  variableId: string,
  input: string
): boolean => {
  const textTokens = lexText(input);
  const isMatch = (token: TextToken) =>
    dialogueTokenToVariableId(token) === variableId;
  return textTokens.some(isMatch);
};

/**
 * Checks if a given variable ID exists in an expression text input.
 * @param {string} variableId - The ID of the variable to search for in the expression (without leading zeros).
 * @param {string} input - The expression text input to search within.
 * @returns {boolean} - True if the variable ID is found in the expression, false otherwise.
 */
export const variableInExpressionText = (
  variableId: string,
  input: string
): boolean => {
  const expressionTokens = tokenizer(input);
  const isMatch = (token: ExpressionToken) =>
    expressionTokenToVariableId(token) === variableId;
  return expressionTokens.some(isMatch);
};
