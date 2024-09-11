import styled, { css } from "styled-components";

// #region FormFieldInput

interface StyledFormFieldInputProps {
  $hasOverride?: boolean;
}

export const StyledFormFieldInput = styled.div<StyledFormFieldInputProps>`
  ${(props) =>
    props.$hasOverride
      ? css`
          border-radius: 3px;
          outline: 3px solid ${(props) => props.theme.colors.prefab.background};
        `
      : ""}
`;

// #endregion FormFieldInput

// #region FormField

interface StyledFormFieldProps {
  readonly $variant?: "normal" | "error" | "warning";
  readonly $alignCheckbox?: boolean;
  readonly $hasOverride?: boolean;
}

export const StyledFormField = styled.div<StyledFormFieldProps>`
  width: 100%;
  min-width: 0;
  ${(props) =>
    props.$variant === "error"
      ? css`
          color: ${props.theme.colors.highlight};
        `
      : ""}
  ${(props) =>
    props.$variant === "warning"
      ? css`
          label {
            background-color: #ffc107;
            color: #000;
            border-radius: 3px;
            padding: 5px;
          }
        `
      : ""}      
  ${(props) =>
    props.$alignCheckbox
      ? css`
          padding-bottom: 5px;
        `
      : ""}
      ${(props) =>
    props.$hasOverride
      ? css`
          font-weight: bold;
        `
      : ""}
`;

// #endregion FormField

// #region FormRow

export const StyledFormRow = styled.div`
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

// #endregion FormRow

// #region FormContainer

// Could probably just remove this
export const StyledFormContainer = styled.div``;

// #endregion FormContainer

// #region FormHeader
interface StyledFormHeaderProps {
  $variant?: "normal" | "prefab";
}

export const StyledFormHeader = styled.div<StyledFormHeaderProps>`
  display: flex;
  align-items: center;
  padding: 4px 10px 4px 4px;
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
  height: 38px;
  box-sizing: border-box;

  & > * {
    margin-right: 10px;
  }

  & > *:last-child {
    margin-right: 0px;
  }

  ${(props) =>
    props.$variant === "prefab"
      ? css`
          background: ${(props) => props.theme.colors.prefab.background};
          color: ${(props) => props.theme.colors.prefab.text};
          input {
            color: ${(props) => props.theme.colors.prefab.text};
            &::placeholder {
              color: ${(props) => props.theme.colors.prefab.text};
              opacity: 0.5;
            }
            &:focus {
              background: ${(props) => props.theme.colors.input.background};
              color: ${(props) => props.theme.colors.input.text};
              border: 1px solid ${(props) => props.theme.colors.highlight};
            }
          }
          svg {
            fill: ${(props) => props.theme.colors.prefab.text};
          }
        `
      : ""}
`;

// #endregion FormHeader

// #region FormDivider

export const StyledFormDivider = styled.div`
  margin-bottom: 10px;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

// #endregion FormDivider

// #region FormFieldInfo

export const StyledFormFieldInfo = styled.div`
  opacity: 0.5;
  display: block;
  font-size: 11px;
  margin-top: 5px;
`;

// #endregion FormFieldInfo

// #region ToggleableFormField

export const StyledFormLink = styled.div`
  font-size: 11px;
  text-decoration: underline;
  border-radius: 4px;
  padding: 5px;
  margin-left: -5px;
  margin-right: -5px;
  margin-top: -5px;
  margin-bottom: -5px;

  &:hover {
    background: rgba(128, 128, 128, 0.1);
  }
  &:active {
    background: rgba(128, 128, 128, 0.2);
  }
`;

// #endregion ToggleableFormField

// #region FormSectionTitle

export interface StyledFormSectionTitleProps {
  readonly $noTopBorder?: boolean;
  readonly $noMarginBottom?: boolean;
}

export const StyledFormSectionTitle = styled.div<StyledFormSectionTitleProps>`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  width: 100%;
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
    props.$noTopBorder
      ? css`
          border-top: 0;
        `
      : ""}

  ${(props) =>
    props.$noMarginBottom
      ? css`
          margin-bottom: 0;
        `
      : ""}
`;

// #endregion FormSectionTitle
