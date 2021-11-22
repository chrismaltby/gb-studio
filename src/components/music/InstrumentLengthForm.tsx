import React from "react";
import l10n from "lib/helpers/l10n";
import { CheckboxField } from "ui/form/CheckboxField";
import { FormRow } from "ui/form/FormLayout";
import { SliderField } from "ui/form/SliderField";

interface InstrumentLengthFormProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
}

export const InstrumentLengthForm = ({
  value,
  onChange,
  min = 1,
  max = 64,
}: InstrumentLengthFormProps) => {
  return (
    <>
      <FormRow>
        <CheckboxField
          label={l10n("FIELD_LENGTH")}
          name="length"
          checked={value !== null}
          onChange={(e) => {
            const value = e.target.checked;
            if (!value) {
              onChange(null);
            } else {
              onChange(32);
            }
          }}
        />
      </FormRow>
      <FormRow>
        <SliderField
          name="length"
          value={value || 0}
          min={value ? min : 0}
          max={max}
          onChange={(value) => {
            onChange(value || 0);
          }}
        />
      </FormRow>
    </>
  );
};
