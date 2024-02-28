import styled, { css } from "styled-components";

interface AlertProps {
  variant: "warning" | "info";
}

export const AlertItem = styled.div`
  padding: 5px 0px;
`;

const Alert = styled.div<AlertProps>`
  padding: 5px;
  border-radius: 4px;
  font-size: 12px;

  ${AlertItem}:first-child {
    padding-top: 0;
  }

  ${AlertItem}:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  ${(props) =>
    props.variant === "warning"
      ? css`
          background-color: #ffc107;
          color: #000;

          ${AlertItem} {
            border-bottom: 1px solid #ffa000;
            padding: 5px 0px;
          }
        `
      : ""}

  ${(props) =>
    props.variant === "info"
      ? css`
          background-color: #03a9f4;
          color: #000;

          ${AlertItem} {
            border-bottom: 1px solid #0088c7;
            padding: 5px 0px;
          }
        `
      : ""}
`;

export default Alert;
