import { UnitsSelectButtonInputOverlay } from "components/forms/UnitsSelectButtonInputOverlay";
import React, { FC } from "react";
import { UnitType } from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import { Input } from "./Input";

export interface NumberInputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  units?: UnitType;
  unitsAllowed?: UnitType[];
  onChangeUnits?: (newUnits: UnitType) => void;
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const NumberInput: FC<NumberInputProps> = ({
  units,
  ref: _ref,
  unitsAllowed,
  onChangeUnits,
  value,
  placeholder,
  ...props
}) => (
  <Wrapper>
    <Input
      type="number"
      value={value || ""}
      placeholder={placeholder}
      {...props}
    />
    {units && (
      <UnitsSelectButtonInputOverlay
        parentValue={String(value || placeholder) ?? ""}
        value={units}
        allowedValues={unitsAllowed}
        onChange={onChangeUnits}
      />
    )}
  </Wrapper>
);

NumberInput.defaultProps = {
  value: undefined,
};
