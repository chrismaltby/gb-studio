import React, { FC } from "react";
import styled, { css } from "styled-components";
import { Label } from "./Label";

export const FormContainer = styled.div``;

export const FormHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};

  & > * {
    margin-right: 10px;
  }

  & > *:last-child {
    margin-right: 0px;
  }
`;

export const FormRow = styled.div`
  display: flex;
  padding: 0 10px;
  width: 100%;
  box-sizing: border-box;

  & > * {
    margin-right: 10px;
    margin-bottom: 10px;
  }

  & > *:last-child {
    margin-right: 0px;
  }
`;

export const FormDivider = styled.div`
  margin-left: -10px;
  margin-right: -10px;
  margin-bottom: 10px;
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
`;

export const FormSpacer = styled.div`
  width: 100%;
`;

interface FormFieldWrapperProps {
  readonly variant?: "normal" | "error";
}

const FormFieldWrapper = styled.div<FormFieldWrapperProps>`
  width: 100%;
  ${(props) =>
    props.variant === "error"
      ? css`
          color: ${props.theme.colors.highlight};
        `
      : ""}
`;

export interface FormFieldProps {
  readonly name: string;
  readonly label?: string;
  readonly variant?: "normal" | "error";
}

export const FormField: FC<FormFieldProps> = ({
  name,
  label,
  variant,
  children,
}) => (
  <FormFieldWrapper variant={variant}>
    {label && <Label htmlFor={name}>{label}</Label>}
    {children}
  </FormFieldWrapper>
);
