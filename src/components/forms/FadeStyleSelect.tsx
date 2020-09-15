import React from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";

interface FadeStyleSelectProps {
  value?: string
  onChange?: (newValue: string) => void
 }

const FadeStyleSelect: React.FC<FadeStyleSelectProps> = ({value, onChange}) => {
  return (
    <select value={value} onChange={(e) => {
      if(onChange) {
        onChange(e.currentTarget.value)
      }
    }}>
      <option value="white">{l10n("FIELD_FADE_WHITE")}</option>
      <option value="black">{l10n("FIELD_FADE_BLACK")}</option>
    </select>
  );
};

FadeStyleSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

FadeStyleSelect.defaultProps = {
  value: undefined,
  onChange: undefined,
};

export default FadeStyleSelect;
