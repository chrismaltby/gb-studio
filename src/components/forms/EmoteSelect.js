import React from "react";

const emotes = [
  "Shock",
  "Question",
  "Love",
  "Pause",
  "Anger",
  "Sweat",
  "Music",
  "Sleep"
];

const EmoteSelect = props => (
  <select {...props}>
    {emotes.map((name, index) => (
      <option key={index} value={index}>
        {name}
      </option>
    ))}
  </select>
);

export default EmoteSelect;
