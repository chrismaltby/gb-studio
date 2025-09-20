import en from "lang/en.json";

export interface L10NLookup {
  [key: string]: string | boolean | undefined;
}

export interface L10NParams {
  [key: string]: string | number | undefined;
}

export type L10NKey = keyof typeof en;

const l10nStrings: L10NLookup = {};
let hasInit = false;

export const setL10NData = (data: L10NLookup) => {
  for (const key in data) {
    l10nStrings[key] = data[key];
  }
  hasInit = true;
};

export const clearL10NData = () => {
  for (const key in l10nStrings) {
    delete l10nStrings[key];
  }
};

export const getL10NData = () => {
  return l10nStrings;
};

export const replaceParams = (string: string, params: L10NParams) => {
  let outputString = string;
  Object.keys(params).forEach((param) => {
    const pattern = new RegExp(`{${param}}`, "g");
    const paramValue = String(params[param] ?? "");
    outputString = outputString.replace(pattern, paramValue);
  });
  return outputString;
};

const l10n = (key: L10NKey, params?: L10NParams): string => {
  if (!hasInit && process.env.NODE_ENV !== "test") {
    console.warn(`L10N used before initialisation for key "${key}"`);
  }
  const l10nString = l10nStrings[key] ?? key;
  if (typeof l10nString === "string") {
    if (params) {
      return replaceParams(l10nString, params);
    }
    return l10nString;
  }
  return String(l10nString);
};

export default l10n;
