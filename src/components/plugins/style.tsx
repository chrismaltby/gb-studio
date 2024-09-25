import styled from "styled-components";

export const StyledPluginManagerWindow = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const StyledPluginManagerListColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

export const StyledPluginManagerSearch = styled.div`
  display: flex;
  padding: 5px;
  & > *:not(:last-child) {
    width: 120px;
    margin-right: 5px;
  }
  & > :first-child {
    flex-grow: 1;
  }
`;

export const StyledPluginManagerSearchResults = styled.div`
  height: 200px;
  flex-grow: 1;
  & > * > * {
    overflow-y: scroll !important;
  }
`;

export const StyledPluginManagerNoResults = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

export const StyledPluginManagerDetailColumn = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${(props) => props.theme.colors.input.background};
`;

export const StyledPluginManagerDetail = styled.div`
  user-select: text;
  flex-grow: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  h1 {
    margin-top: 0;
  }
  h2 {
    marigin-top: 0;
  }
  img {
    max-width: 100%;
  }
  overflow: auto;
`;

export const StyledPluginManagerToolbar = styled.div`
  font-size: 11px;
  display: flex;
  min-height: 30px;
  padding: 10px;
  align-items: center;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  & > *:not(:last-child) {
    margin-right: 5px;
  }
`;

export const StyledPluginManagerNoSelectionView = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export const StyledPluginImageCarousel = styled.div`
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  img {
    height: 150px;
  }
  & > *:not(:last-child) {
    margin-right: 5px;
  }
`;

export const StyledPluginItemRow = styled.div`
  display: flex;
`;

export const StyledPluginItemRowName = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledPluginItemRowType = styled.div`
  width: 125px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledPluginItemRowRepo = styled.div`
  width: 135px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledPluginItemRowRepoName = styled.div`
  width: 125px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledPluginItemRowRepoUrl = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledPluginItemRowRepoBtns = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${StyledPluginItemRow} & {
    opacity: 0;
  }
  ${StyledPluginItemRow}:hover & {
    opacity: 1;
  }
`;

export const StyledPluginManagerRepoForm = styled.div`
  padding: 10px;
  & input {
    margin-bottom: 10px;
  }
`;

export const StyledPluginManagerRepoBtns = styled.div`
  display: flex;
`;
