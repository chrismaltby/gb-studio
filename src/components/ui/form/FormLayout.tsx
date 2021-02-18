import React, { FC } from "react";
import styled, { css } from "styled-components";
import { Label } from "./Label";

export const FormContainer = styled.div``;

export const FormHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 10px 4px 4px;
  margin-bottom: 10px;
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};

  & > * {
    margin-right: 10px;
  }

  & > *:last-child {
    margin-right: 0px;
  }
`;

export interface FormRowProps {
  readonly size?: "medium" | "large";
}

export const FormRow = styled.div<FormRowProps>`
  display: flex;
  padding: 0 10px;
  width: 100%;
  box-sizing: border-box;

  & > * {
    ${(props) =>
      props.size === "large"
        ? css`
            margin-right: 20px;
            margin-bottom: 20px;
          `
        : css`
            margin-right: 10px;
            margin-bottom: 10px;
          `}
  }

  & > *:last-child {
    margin-right: 0px;
  }
`;

export const FormDivider = styled.div`
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
  min-width: 0;
  ${(props) =>
    props.variant === "error"
      ? css`
          color: ${props.theme.colors.highlight};
        `
      : ""}
`;

const FormFieldInfo = styled.div`
  opacity: 0.5;
  display: block;
  font-size: 11px;
  margin-top: 5px;
`;

export interface FormFieldProps {
  readonly name: string;
  readonly label?: string;
  readonly info?: string;
  readonly variant?: "normal" | "error";
}

export const FormField: FC<FormFieldProps> = ({
  name,
  label,
  info,
  variant,
  children,
}) => (
  <FormFieldWrapper variant={variant}>
    {label && <Label htmlFor={name}>{label}</Label>}
    {children}
    {info && <FormFieldInfo>{info}</FormFieldInfo>}
  </FormFieldWrapper>
);

export interface FormSectionTitleProps {
  readonly noTopBorder?: boolean;
}

export const FormSectionTitle = styled.div<FormSectionTitleProps>`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  height: 30px;
  margin-bottom: 10px;
  background-color: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border-top: 1px solid ${(props) => props.theme.colors.input.border};
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};

  > span {
    flex-grow: 1;
  }

  ${(props) =>
    props.noTopBorder
      ? css`
          border-top: 0;
        `
      : ""}
`;
