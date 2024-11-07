import InputPicker from "components/forms/InputPicker";
import React, { useEffect, useRef } from "react";
import { useCallback } from "react";
import styled from "styled-components";
import { FormRow } from "ui/form/layout/FormLayout";

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
    [debouncedLeave]
  );

  return (
    <Form onFocus={onFocus} onBlur={onFocusOut}>
      <FormRow>
        <InputPicker
          id="replaceInput"
          value={value}
          onChange={onChange}
          autoFocus
          multiple
        />
      </FormRow>
    </Form>
  );
};
