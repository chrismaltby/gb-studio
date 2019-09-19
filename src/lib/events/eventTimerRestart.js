import l10n from "../helpers/l10n";

export const id = "EVENT_TIMER_RESTART";

export const fields = [
  {
    label: l10n("FIELD_TIMER_RESTART")
  }
];

export const compile = (input, helpers) => {
  const { timerRestart } = helpers;
  timerRestart();
};
