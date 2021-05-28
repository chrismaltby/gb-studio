import styled from "styled-components";

export const SearchInput = styled.input.attrs((_props) => ({
  type: "search",
}))`
  height: 26px;
  width: 125px;
  background-color: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.button.toolbar.border};
  border-radius: 20px;
  font-size: 13px;
  padding: 0px 10px;
`;
