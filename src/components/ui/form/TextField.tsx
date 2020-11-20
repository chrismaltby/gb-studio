import React, { FC, ReactNode } from "react";
import styled from "styled-components";
import { FormField } from "./FormLayout";
import { Input } from "./Input";

export interface TextFieldProps {
  readonly name: string;
  readonly label?: string;
  readonly info?: string;
  readonly placeholder?: string;
  readonly errorLabel?: string;
  readonly value?: string;
  readonly size?: "small" | "medium" | "large";
  readonly onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly additionalRight?: ReactNode;
}

const AdditionalWrapper = styled.div`
  position: relative;
`;

const AdditionalRight = styled.div`
  position: absolute;
  top: 3px;
  bottom: 3px;
  right: 3px;
  display: flex;

  && > * {
    height: 100%;
    margin-left: 5px;
  }
`;

export const TextField: FC<TextFieldProps> = ({
  name,
  label,
  info,
  placeholder,
  errorLabel,
  size,
  value,
  onChange,
  additionalRight,
}) => (
  <FormField
    name={name}
    label={errorLabel || label}
    info={info}
    variant={errorLabel ? "error" : undefined}
  >
    {additionalRight ? (
      <AdditionalWrapper>
        <Input
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          displaySize={size}
          onChange={onChange}
          style={{ paddingRight: 60 }}
        />
        <AdditionalRight>{additionalRight}</AdditionalRight>
      </AdditionalWrapper>
    ) : (
      <Input
        id={name}
        name={name}
        value={value}
        displaySize={size}
        onChange={onChange}
      />
    )}
  </FormField>
);

TextField.defaultProps = {
  value: "",
};
