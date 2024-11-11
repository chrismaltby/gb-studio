import { UnitSelectLabelButton } from "components/forms/UnitsSelectLabelButton";
import React, { useEffect, useRef } from "react";
import { useCallback } from "react";
import { TimeUnitType } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ensureNumber } from "shared/types";
import styled from "styled-components";
import { FormField, FormRow } from "ui/form/layout/FormLayout";
import { NumberInput } from "ui/form/NumberInput";

interface TextWaitTimeSelectProps {
  value: number;
  units: "frames" | "time";
  onChange: (newValue: number) => void;
  onChangeUnits: (newUnits: "frames" | "time") => void;
  onBlur: () => void;
}

const Form = styled.form`
  min-width: 200px;
  padding-top: 5px;
`;

export const TextWaitTimeSelect = ({
  value,
  units,
  onChange,
  onChangeUnits,
  onBlur,
}: TextWaitTimeSelectProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onBlur();
    }, 250);
  }, [onBlur]);

  useEffect(() => {
    return () => {
      // Cleanup timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const onFocus = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const onFocusOut = useCallback(
    (event: React.FocusEvent<HTMLFormElement, Element>) => {
      if (event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      debouncedLeave();
    },
    [debouncedLeave]
  );

  const blockSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <Form onFocus={onFocus} onBlur={onFocusOut} onSubmit={blockSubmit}>
      <FormRow>
        <FormField
          name="replaceWaitTime"
          label={
            <>
              {l10n("EVENT_WAIT")}
              <UnitSelectLabelButton
                value={units}
                allowedValues={["time", "frames"]}
                onChange={(value) => {
                  onChangeUnits(value as TimeUnitType);
                }}
              />
            </>
          }
        >
          <NumberInput
            id="replaceWaitTime"
            value={value}
            onChange={(e) => {
              const value = Math.max(
                0,
                ensureNumber(parseFloat(e.currentTarget.value), 0)
              );
              onChange(value);
            }}
            autoFocus
          />
        </FormField>
      </FormRow>
    </Form>
  );
};
