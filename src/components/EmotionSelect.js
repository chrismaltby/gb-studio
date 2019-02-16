import React from "react";

const emotions = [
  "Shock",
  "Question",
  "Love",
  "Pause",
  "Anger",
  "Sweat",
  "Music",
  "Sleep"
];

const EmotionSelect = props => (
  <select {...props}>
    {emotions.map((name, index) => (
      <option key={index} value={index}>
        {name}
      </option>
    ))}
  </select>
);

export default EmotionSelect;
