import React from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";
import { Select, Option } from "../ui/form/Select";

interface FadeStyleSelectProps {
  value?: string;
  onChange?: (newValue: string) => void;
}

type FadeStyle = "white" | "black";

const fadeOptionsLookup: Record<FadeStyle, Option> = {
  white: {
    value: "white",
    label: l10n("FIELD_FADE_WHITE"),
  },
  black: {
    value: "black",
    label: l10n("FIELD_FADE_BLACK"),
  },
};

const fadeOptions: Option[] = [
  fadeOptionsLookup["white"],
  fadeOptionsLookup["black"],
];

const FadeStyleSelect: React.FC<FadeStyleSelectProps> = ({
  value,
  onChange,
}) => {
  const currentValue = fadeOptionsLookup[value as FadeStyle];
  return (
    <Select
      value={currentValue}
      options={fadeOptions}
      onChange={(e: Option) => {
        if (onChange) {
          onChange(e.value);
        }
      }}
    />
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
