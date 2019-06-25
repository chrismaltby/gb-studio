import { NodeVM } from "vm2";

export const id = "EVENT_CODE";

export const fields = [
  {
    key: "code",
    type: "code",
    rows: 10
  }
];

const vm = new NodeVM({
  timeout: 1000,
  sandbox: {}
});

export const compile = (input, helpers) => {
  const code = `module.exports = function(helpers){
    Object.keys(helpers).forEach((key) => {
      this[key] = helpers[key];
    });
    ${input.code}
    return helpers;
  }`;
  const handler = vm.run(code);
  handler(helpers);
};
