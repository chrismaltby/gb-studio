import styled from "styled-components";
import { CardHeading } from "../cards/Card";

export const SettingRow = styled.div`
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

  & > :nth-child(2) {
    max-width: 300px;
  }
`;

export const SettingRowLabel = styled.label`
  width: 300px;
  height: 28px;
  display: flex;
  align-items: center;
  font-size: ${(props) => props.theme.typography.fontSize};
`;

export const SettingRowInput = styled.div`
  width: 300px;
  min-height: 28px;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;
