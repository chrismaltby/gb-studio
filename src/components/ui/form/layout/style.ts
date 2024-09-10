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
