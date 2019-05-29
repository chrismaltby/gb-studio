import React from "react";
import PropTypes from "prop-types";

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

const EmoteSelect = ({ id, value, onChange }) => (
  <select id={id} value={value} onChange={onChange}>
    {emotes.map((name, index) => (
      <option key={name} value={index}>
        {name}
      </option>
    ))}
  </select>
);

EmoteSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

EmoteSelect.defaultProps = {
  id: undefined,
  value: ""
};

export default EmoteSelect;
