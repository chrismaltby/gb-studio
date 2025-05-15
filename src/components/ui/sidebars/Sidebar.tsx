import styled from "styled-components";
import { StyledFormSectionTitle } from "ui/form/layout/style";

export const SidebarColumn = styled.div`
  padding-top: 10px;
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-left: 1px solid ${(props) => props.theme.colors.sidebar.border};
  margin-top: -1px;
  margin-left: -1px;

  & > ${StyledFormSectionTitle}:first-child {
    margin-top: -11px;
  }
`;

export const Sidebar = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
`;

export const SidebarColumns = styled.div`
  width: 100%;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};

  display: flex;
  flex-wrap: wrap;
  ${SidebarColumn} {
    flex-grow: 1;
    width: 25%;
    min-width: 260px;
  }
`;
