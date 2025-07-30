import { UnitsSelectButtonInputOverlay } from "components/forms/UnitsSelectButtonInputOverlay";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { UnitType } from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import { StyledInput } from "./style";

export interface NumberInputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  units?: UnitType;
  unitsAllowed?: UnitType[];
  onChangeUnits?: (newUnits: UnitType) => void;
}

const NumberInputWrapper = styled.div`
  position: relative;
  width: 100%;
  min-width: 45px;
`;

const valueToString = (value: unknown) =>
  value !== undefined && value !== null ? String(value) : "";

export const NumberInput: FC<NumberInputProps> = ({
  units,
  ref: _ref,
  unitsAllowed,
  onChangeUnits,
  value,
  placeholder,
  onChange,
  onBlur,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stringValue, setStringValue] = useState(valueToString(value));

  const onChangeInternal = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStringValue = e.currentTarget.value;
      setStringValue(newStringValue);
      onChange?.(e);
    },
    [onChange],
  );

  const onBlurInternal = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setStringValue(valueToString(value));
      onBlur?.(e);
    },
    [onBlur, value],
  );

  useEffect(() => {
    const newStringValue = valueToString(value);
    if (
      document.activeElement !== inputRef.current &&
      stringValue !== newStringValue &&
      (newStringValue !== "0" || document.activeElement !== inputRef.current)
    ) {
      setStringValue(valueToString(value));
    }
  }, [stringValue, value]);

  return (
    <NumberInputWrapper>
      <StyledInput
        ref={inputRef}
        type="number"
        value={stringValue}
        placeholder={placeholder}
        onChange={onChangeInternal}
        onBlur={onBlurInternal}
        {...props}
      />
      {units && (
        <UnitsSelectButtonInputOverlay
          parentValue={String(stringValue || placeholder) ?? ""}
          value={units}
          allowedValues={unitsAllowed}
          onChange={onChangeUnits}
        />
      )}
    </NumberInputWrapper>
  );
};
