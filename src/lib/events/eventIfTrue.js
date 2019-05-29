import { getVariableIndex, compileConditional } from "./helpers";
import { commandIndex as cmd, IF_TRUE } from "./scriptCommands";
import { hi, lo } from "../helpers/8bit";

export const key = "EVENT_IF_TRUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "false",
    type: "events"
  }
];

export const compile = (input, output, options) => {
  const { variables } = options;
  output.push(cmd(IF_TRUE));
  const variableIndex = getVariableIndex(input.args.variable, variables);
  output.push(hi(variableIndex));
  output.push(lo(variableIndex));
  compileConditional(input.true, input.false, {
    ...options,
    output
  });
};
