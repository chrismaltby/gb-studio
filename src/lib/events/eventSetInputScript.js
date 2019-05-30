import l10n from "../helpers/l10n";

export const id = "EVENT_SET_INPUT_SCRIPT";

export const fields = [
  {
    key: "input",
    label: l10n("FIELD_ON_PRESS"),
    type: "input",
    defaultValue: "b"
  },
  {
    key: "script",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { setInputScript } = helpers;
  setInputScript(input.input, input.script);
  //   const bankPtr = subScripts[input[i].id];
  //   if (bankPtr) {
  //     output.push(CMD_LOOKUP.SET_INPUT_SCRIPT);
  //     output.push(inputDec(input[i].args.input));
  //     output.push(bankPtr.bank);
  //     output.push(hi(bankPtr.offset));
  //     output.push(lo(bankPtr.offset));
  //   }
};
