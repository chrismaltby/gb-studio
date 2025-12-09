import styled, { css } from "styled-components";
import { CardHeading } from "ui/cards/Card";

interface SettingRowProps {
  $indent?: number;
  $isCheckbox?: boolean;
}

interface SettingRowLabelProps {
  $sectionHeading?: boolean;
  $disabled?: boolean;
}

export const SettingRowLabel = styled.label<SettingRowLabelProps>`
  min-height: 28px;
  padding: 5px 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  font-size: ${(props) => props.theme.typography.fontSize};
  ${(props) =>
    props.$sectionHeading
      ? css`
          font-weight: bold;
        `
      : ""}

  ${(props) =>
    props.$disabled
      ? css`
          opacity: 0.5;
          text-decoration: line-through;
        `
      : ""}

  max-width: 300px;
  min-width: 150px;
  width: 50%;
  padding-right: 5px;

  @container (max-width: 300px) {
    min-height: 0px;
    width: 100%;
  }
`;

export const SettingRowInput = styled.div`
  width: 300px;
  min-height: 28px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-self: center;

  @container (max-width: 300px) {
    width: 100%;
    padding-bottom: 4px;
  }
`;

export const SettingRowUnits = styled.label`
  min-height: 28px;
  min-width: 30px;
  padding: 5px 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 10px;
  font-size: ${(props) => props.theme.typography.fontSize};
`;

export const SettingRow = styled.div<SettingRowProps>`
  position: relative;
  display: flex;
  padding-bottom: 3px;
  padding-top: 3px;
  border-bottom: 1px solid ${(props) => props.theme.colors.card.divider};
  align-items: flex-start;
  padding: 3px 5px;
  box-sizing: border-box;
  min-height: 34px;

  ${CardHeading} + & {
    border-top: 1px solid ${(props) => props.theme.colors.card.divider};
  }

  ${(props) =>
    props.$indent
      ? css`
          ${SettingRowLabel} {
            padding-left: ${props.$indent * 20}px;
          }
        `
      : ""}

  @container (max-width: 300px) {
    flex-direction: column;
    padding-top: 0px;
    min-height: 0;

    &&& ${SettingRowLabel} {
      padding-left: 0px;
    }

    ${(props) =>
      props.$indent
        ? css`
            &&& {
              padding-left: ${props.$indent * 24 + 10}px;
            }
          `
        : ""}

    ${(props) =>
      props.$isCheckbox
        ? css`
            &&& {
              flex-direction: row-reverse;
              justify-content: flex-end;
              align-items: center;
            }
            &&& ${SettingRowLabel} {
              padding-left: 5px;
            }
            &&& ${SettingRowInput} {
              padding-bottom: 0px;
            }
          `
        : ""}
  }
`;

export const SettingsSidebarContainer = styled.div`
  background: ${(props) => props.theme.colors.card.background};
  color: ${(props) => props.theme.colors.card.text};
  padding: 0px;
  border-top: 1px solid ${(props) => props.theme.colors.card.border};
  border-bottom: 1px solid ${(props) => props.theme.colors.card.border};
  width: 100%;
  box-sizing: border-box;
  container-type: inline-size;

  ${SettingRow} {
    padding-left: 10px;
    padding-right: 10px;
  }

  ${SettingRow}:last-child {
    border-bottom: 0;
  }
`;
