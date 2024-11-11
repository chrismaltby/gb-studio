import { ensureNumber } from "shared/types";
import { lexText, Token } from "shared/lib/compiler/lexText";

export const splitTextOnWaitCodes = (input: string): string[] =>
  input.split(/(!W:[0-9]+[fs]!)/g);

export const parseWaitCodeValue = (input: string): number | undefined => {
  const waitCode = input.match(/!W:([0-9.]+)([fs])!/);
  if (!waitCode) {
    return undefined;
  }
  const time = ensureNumber(parseFloat(waitCode[1]), 30);
  return time;
};

export const parseWaitCodeFrames = (input: string): number | undefined => {
  const waitCode = input.match(/!W:([0-9.]+)([fs])!/);
  if (!waitCode) {
    return undefined;
  }
  const frames = ensureNumber(parseFloat(waitCode[1]), 30);
  const units = waitCode[2];
  if (units === "s") {
    return Math.round(frames * 60);
  }
  return Math.round(frames);
};

export const parseWaitCodeUnits = (input: string): "frames" | "time" => {
  if (input[input.length - 2] === "s") {
    return "time";
  }
  return "frames";
};

type TextAction = {
  type: "wait";
  frames: number;
};

type TokenChunk = {
  tokens: Token[];
  action?: TextAction;
};

export const chunkTokensOnWaitCodes = (tokens: Token[]): TokenChunk[] => {
  if (tokens.length === 0) {
    return [];
  }

  // No wait tokens found so just return parsed tokens wrapped in array
  if (!tokens.some((token) => token.type === "wait")) {
    return [{ tokens }];
  }

  const output: TokenChunk[] = [{ tokens: [] }];

  let lastSpeedToken: (Token & { type: "speed" | "speedVariable" }) | undefined;
  let lastFontToken: (Token & { type: "font" | "fontVariable" }) | undefined;

  for (const token of tokens) {
    if (token.type === "wait") {
      output[output.length - 1].action = token;
      output.push({
        tokens: [
          // Apply any speed / font changes from before split
          ...(lastSpeedToken ? [lastSpeedToken] : []),
          ...(lastFontToken ? [lastFontToken] : []),
        ],
      });
    } else {
      // Track speed changes
      if (token.type === "speed" || token.type === "speedVariable") {
        lastSpeedToken = token;
      }
      // Track font changes
      if (token.type === "font" || token.type === "fontVariable") {
        lastFontToken = token;
      }
      output[output.length - 1].tokens.push(token);
    }
  }

  return output;
};

export const chunkTextOnWaitCodes = (input: string): TokenChunk[] => {
  return chunkTokensOnWaitCodes(lexText(input));
};
