import { ensureNumber } from "shared/types";

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
