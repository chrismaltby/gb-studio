import styled, { css } from "styled-components";

interface SidebarProps {
  multiColumn?: boolean;
}

export const SidebarColumn = styled.div``;

export const Sidebar = styled.div<SidebarProps>`
  width: 100%;
  height: 100%;

  ${(props) => (props.multiColumn ? stackStyles : scrollStyles)}
`;

const stackStyles = css`
  display: flex;

  ${SidebarColumn} {
    overflow-y: auto;
    flex-grow: 1;
    width: 100%;
    height: 100%;
    border-left: 1px solid ${(props) => props.theme.colors.sidebar.border};
  }

  ${SidebarColumn}:first-child {
    border-left: 0;
  }
`;

const scrollStyles = css`
  overflow-y: auto;
  height: 100%;
`;
