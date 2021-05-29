import styled from "styled-components";
import { Card } from "ui/cards/Card";

export const SettingsPageWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
`;

export const SettingsMenuColumn = styled.div`
  width: 260px;
  height: calc(100vh - 38px);
  overflow-y: auto;
  padding: 20px;
  padding-right: 0;
  box-sizing: border-box;

  ${Card} {
    padding: 0;
  }

  ${Card} > * {
    border-bottom: 1px solid ${(props) => props.theme.colors.card.divider};
  }

  ${Card} > *:last-child {
    border-bottom: 0;
  }
`;

export const SettingsSearchWrapper = styled.div`
  padding: 5px;
`;

export const SettingsSearch = styled.input`
  padding: 5px;
  width: 100%;
  border-radius: 4px;
`;

export const SettingsMenuItem = styled.a`
  display: block;
  margin: 0;
  padding: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  &:hover,
  &:focus {
    background: ${(props) => props.theme.colors.menu.hoverBackground};
    outline: none;
    box-shadow: none;
  }

  &:active {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }
`;

export const SettingsContentColumn = styled.div`
  width: 100%;
  flex-grow: 1;
  height: calc(100vh - 38px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  padding-bottom: 50vh;
  scroll-behavior: smooth;

  & > * {
    max-width: 980px;
    margin: 0 auto 20px;
  }
`;
