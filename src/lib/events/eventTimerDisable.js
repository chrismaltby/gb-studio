import l10n from "../helpers/l10n";

export const id = "EVENT_TIMER_DISABLE";

export const fields = [
  {
    label: l10n("FIELD_TIMER_DISABLE")
  }
];

export const compile = (input, helpers) => {
  const { timerDisable } = helpers;
  timerDisable();
};
