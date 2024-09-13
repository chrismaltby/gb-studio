import styled, { css } from "styled-components";

interface StyledAlertProps {
  $variant: "warning" | "info";
}

export const StyledAlertItem = styled.div`
  padding: 5px 0px;
`;

const StyledAlert = styled.div<StyledAlertProps>`
  padding: 5px;
  border-radius: 4px;
  font-size: 12px;

  ${StyledAlertItem}:first-child,
  > p:first-child {
    padding-top: 0;
    margin-top: 0;
  }

  ${StyledAlertItem}:last-child,
  > p:last-child {
    border-bottom: 0;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  ${(props) =>
    props.$variant === "warning"
      ? css`
          background-color: #ffc107;
          color: #000;

          ${StyledAlertItem} {
            border-bottom: 1px solid #ffa000;
            padding: 5px 0px;
          }
        `
      : ""}

  ${(props) =>
    props.$variant === "info"
      ? css`
          background-color: #03a9f4;
          color: #000;

          ${StyledAlertItem} {
            border-bottom: 1px solid #0088c7;
            padding: 5px 0px;
          }
        `
      : ""}
`;

export default StyledAlert;
