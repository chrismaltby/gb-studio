import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCallback } from "react";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { FormField, FormRow } from "ui/form/layout/FormLayout";
import { NumberInput } from "ui/form/NumberInput";
import { ToggleButtonGroup } from "ui/form/ToggleButtonGroup";

export interface TextGotoValue {
  offsetX: number;
  offsetY: number;
  relative: boolean;
}

interface TextGotoSelectProps {
  value: TextGotoValue;
  onChange: (newValue: TextGotoValue) => void;
  onBlur: () => void;
}

const Form = styled.form`
  min-width: 200px;
  padding-top: 5px;
`;

export const TextGotoSelect = ({
  value,
  onChange,
  onBlur,
}: TextGotoSelectProps) => {
  const [internalValue, setValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const options = useMemo(
    () => [
      {
        value: false,
        label: l10n("FIELD_SET_TO"),
      },
      {
        value: true,
        label: l10n("FIELD_MOVE_BY"),
      },
    ],
    []
  );

  const debouncedLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onChange(internalValue);
      onBlur();
    }, 250);
  }, [internalValue, onBlur, onChange]);

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
    (event) => {
      if (event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      debouncedLeave();
    },
    [debouncedLeave]
  );

  const onChangeRelative = useCallback(
    (newRelative: boolean) => {
      setValue({
        ...internalValue,
        relative: newRelative,
      });
    },
    [internalValue]
  );

  const onChangeX = useCallback(
    (event) => {
      setValue({
        ...internalValue,
        offsetX: parseInt(event.currentTarget.value, 10),
      });
    },
    [internalValue]
  );

  const onChangeY = useCallback(
    (event) => {
      setValue({
        ...internalValue,
        offsetY: parseInt(event.currentTarget.value, 10),
      });
    },
    [internalValue]
  );

  return (
    <Form onFocus={onFocus} onBlur={onFocusOut}>
      <FormRow>
        <ToggleButtonGroup
          name="relative"
          value={internalValue.relative}
          options={options}
          onChange={onChangeRelative}
        />
      </FormRow>
      <FormRow>
        <FormField name="gotoX" label={l10n("FIELD_X")}>
          <NumberInput
            id="gotoX"
            name="gotoX"
            autoFocus
            placeholder="x"
            min={internalValue.relative ? -32 : 0}
            max={32}
            value={internalValue.offsetX}
            onChange={onChangeX}
          />
        </FormField>
        <FormField name="gotoY" label={l10n("FIELD_Y")}>
          <NumberInput
            id="gotoY"
            name="gotoY"
            placeholder="y"
            min={internalValue.relative ? -32 : 0}
            max={32}
            value={internalValue.offsetY}
            onChange={onChangeY}
          />
        </FormField>
      </FormRow>
    </Form>
  );
};
