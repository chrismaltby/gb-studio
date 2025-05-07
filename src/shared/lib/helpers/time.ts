import l10n from "shared/lib/lang/l10n";

export const msToHumanTime = (milliseconds: number): string => {
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0
    ? l10n("FIELD_TIME_MINUTES_AND_SECONDS", {
        minutes,
        seconds: Math.floor(seconds),
      })
    : l10n("FIELD_TIME_SECONDS", { seconds: parseFloat(seconds.toFixed(2)) });
};
