import React from "react";

const operators = {
  "==": "Equal To",
  "!=": "Not Equal To,
  "<": "Less Than",
  ">": "Greater Than",
  "<=": "Less Than Or Equal To",
  ">=": "Greater Than Or Equal To"
};

const OperatorSelect = props => (
  <select {...props}>
    {Object.keys(operators).map((key, index) => (
      <option key={index} value={index}>
        {operators[key]}
      </option>
    ))}
  </select>
);

export default OperatorSelect;
