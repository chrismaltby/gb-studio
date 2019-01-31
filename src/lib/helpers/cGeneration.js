import { decHex } from "./8bit";

export const C_NAME_INVALID = "C_NAME_INVALID";
export const C_DATA_EMPTY = "C_DATA_EMPTY";
export const C_DATA_INVALID = "C_DATA_INVALID";

const validCIdentifier = /[a-zA-Z_][a-zA-Z0-9]*/;

export const cIntArrayExternDeclaration = name => {
  if (!name || !name.match(validCIdentifier)) {
    throw C_NAME_INVALID;
  }
  return `extern const unsigned char ${name}[];`;
};

export const cIntArray = (name, data) => {
  if (!Array.isArray(data)) {
    throw C_DATA_INVALID;
  }
  if (data.length === 0) {
    throw C_DATA_EMPTY;
  }
  if (!name || !name.match(validCIdentifier)) {
    throw C_NAME_INVALID;
  }
  return `const unsigned char ${name}[] = {\n${data.map(decHex).join(",")}\n};`;
};
