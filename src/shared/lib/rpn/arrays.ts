import { Token } from "./types";
import tokenize from "./tokenizer";
import { getBaseName } from "shared/lib/helpers/virtualFilesystem";

/**
 * Support for variable array syntax in math expressions.
 *
 * A variable array is a folder of global variables (as created with
 * "Add Array" in the variables navigator). Expressions can read and write
 * array items using the folder name and an index expression:
 *
 *   ArrayName[0]           — read the first variable in the folder
 *   ArrayName[$idx$]       — read using a variable as the index
 *   ArrayName[$idx$] = 5   — assign to an array item
 *   $result$ = ArrayName[2] — assignments to plain variables also supported
 *
 * Array accesses can't be compiled inline within a single VM_RPN
 * instruction (the target index must first be stored in a memory location
 * for the indirect reference operations), so accesses are extracted from
 * the token stream here and replaced with ARRAYVAL placeholder tokens.
 * The compiler evaluates each extracted access index into a local first,
 * then references it indirectly from the main expression.
 */

export type ParsedArrayExpression = {
  tokens: Token[];
  arrayAccesses: ExpressionArrayAccess[];
};

export type ExpressionArrayAccess = {
  id: number;
  name: string;
  index: ParsedArrayExpression;
};

export type ExpressionAssignTarget =
  | { type: "variable"; symbol: string }
  | { type: "array"; name: string; index: ParsedArrayExpression };

export type ParsedExpressionStatement = {
  target?: ExpressionAssignTarget;
  value: ParsedArrayExpression;
};

// Check if an array name used in an expression or value refers to the
// variable folder at the given path. Names match the folder's full path or
// its basename, ignoring case and whitespace (whitespace is stripped when
// tokenizing expressions)
export const matchesArrayName = (name: string, folderPath: string): boolean => {
  const normalize = (s: string) => s.replace(/[\s\\]+/g, "").toLowerCase();
  const normalizedName = normalize(name);
  return (
    normalizedName === normalize(folderPath) ||
    normalizedName === normalize(getBaseName(folderPath))
  );
};

// Extract the names of all array accesses within an expression string,
// including assignment targets and nested accesses. Returns an empty list
// for invalid expressions
export const expressionArrayNames = (expression: string): string[] => {
  try {
    const statement = parseExpressionStatement(tokenize(expression));
    const names: string[] = [];
    const collect = (parsed: ParsedArrayExpression) => {
      for (const access of parsed.arrayAccesses) {
        names.push(access.name);
        collect(access.index);
      }
    };
    collect(statement.value);
    if (statement.target?.type === "array") {
      names.push(statement.target.name);
      collect(statement.target.index);
    }
    return names;
  } catch {
    return [];
  }
};

// Rewrite array accesses within an expression string that refer to the
// folder at fromPath so they use newName instead, preserving the rest of
// the expression text. Used when renaming/moving variable folders
export const renameArrayInExpressionText = (
  text: string,
  fromPath: string,
  newName: string,
): string => {
  // Array names are identifier-like sequences (possibly containing spaces,
  // as whitespace is stripped when tokenizing) directly before a "["
  return text.replace(
    /([A-Za-z_][A-Za-z0-9_]*(?:[ \t]+[A-Za-z0-9_]+)*)([ \t]*\[)/g,
    (match, name: string, bracket: string) => {
      if (!matchesArrayName(name, fromPath)) {
        return match;
      }
      return `${newName}${bracket}`;
    },
  );
};

const findMatchingBracket = (tokens: Token[], openIndex: number): number => {
  let depth = 0;
  for (let i = openIndex; i < tokens.length; i++) {
    if (tokens[i].type === "LBRACKET") {
      depth++;
    } else if (tokens[i].type === "RBRACKET") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  throw new Error(`Missing "]" in expression`);
};

export const extractArrayAccesses = (
  tokens: Token[],
  idState: { count: number } = { count: 0 },
): ParsedArrayExpression => {
  const outTokens: Token[] = [];
  const arrayAccesses: ExpressionArrayAccess[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    const next = tokens[i + 1];
    if (
      token.type === "VAR" &&
      !token.symbol.startsWith("$") &&
      next?.type === "LBRACKET"
    ) {
      const close = findMatchingBracket(tokens, i + 1);
      const indexTokens = tokens.slice(i + 2, close);
      if (indexTokens.length === 0) {
        throw new Error(`Missing array index for "${token.symbol}"`);
      }
      const index = extractArrayAccesses(indexTokens, idState);
      const id = idState.count++;
      arrayAccesses.push({
        id,
        name: token.symbol,
        index,
      });
      outTokens.push({
        type: "ARRAYVAL",
        id,
      });
      i = close + 1;
      continue;
    }
    if (token.type === "LBRACKET") {
      throw new Error(`Unexpected "[" in expression`);
    }
    if (token.type === "RBRACKET") {
      throw new Error(`Unexpected "]" in expression`);
    }
    outTokens.push(token);
    i++;
  }
  return {
    tokens: outTokens,
    arrayAccesses,
  };
};

export const parseExpressionStatement = (
  tokens: Token[],
): ParsedExpressionStatement => {
  // Find a top level assignment
  let depth = 0;
  let assignIndex = -1;
  tokens.forEach((token, i) => {
    if (token.type === "LBRACE" || token.type === "LBRACKET") {
      depth++;
    } else if (token.type === "RBRACE" || token.type === "RBRACKET") {
      depth--;
    } else if (token.type === "ASSIGN" && depth === 0) {
      if (assignIndex !== -1) {
        throw new Error(`Only a single "=" is allowed in an expression`);
      }
      assignIndex = i;
    }
  });

  const idState = { count: 0 };

  if (assignIndex === -1) {
    return {
      value: extractArrayAccesses(tokens, idState),
    };
  }

  const lhs = tokens.slice(0, assignIndex);
  const rhs = tokens.slice(assignIndex + 1);
  if (rhs.length === 0) {
    throw new Error(`Missing value after "="`);
  }

  let target: ExpressionAssignTarget;
  if (lhs.length === 1 && lhs[0].type === "VAR") {
    const symbol = lhs[0].symbol;
    if (!symbol.startsWith("$")) {
      throw new Error(
        `Left side of "=" must be a variable or an array item e.g. "${symbol}[0]"`,
      );
    }
    target = {
      type: "variable",
      symbol,
    };
  } else if (
    lhs.length >= 4 &&
    lhs[0].type === "VAR" &&
    !lhs[0].symbol.startsWith("$") &&
    lhs[1].type === "LBRACKET" &&
    findMatchingBracket(lhs, 1) === lhs.length - 1
  ) {
    const indexTokens = lhs.slice(2, lhs.length - 1);
    target = {
      type: "array",
      name: lhs[0].symbol,
      index: extractArrayAccesses(indexTokens, idState),
    };
  } else {
    throw new Error(`Left side of "=" must be a variable or an array item`);
  }

  return {
    target,
    value: extractArrayAccesses(rhs, idState),
  };
};
