import InputPicker from "components/forms/InputPicker";
import React, { useEffect, useRef } from "react";
import { useCallback } from "react";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { FormField, FormRow } from "ui/form/layout/FormLayout";

interface TextWaitInputSelectProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  onBlur: () => void;
}

const Form = styled.form`
  min-width: 200px;
  padding-top: 5px;
`;

export const TextWaitInputSelect = ({
  value,
  onChange,
  onBlur,
}: TextWaitInputSelectProps) => {
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
    [debouncedLeave],
  );

  return (
    <Form onFocus={onFocus} onBlur={onFocusOut}>
      <FormRow>
        <FormField
          name="replaceInput"
          label={l10n("FIELD_WAIT_UNTIL_BUTTON_PRESSED")}
        >
          <InputPicker
            id="replaceInput"
            value={value}
            onChange={onChange}
            autoFocus
            multiple
          />
        </FormField>
      </FormRow>
    </Form>
  );
};
