import styled from "styled-components";

export const LinkButton = styled.button`
  background: transparent;
  color: ${(props) => props.theme.colors.text};
  display: inline;
  padding: 0;
  font-size: 11px;
  border: 0;
  margin: 0;
  height: 11px;
  text-align: left;

  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  overflow: hidden;
  line-height: 11px;

  &:hover {
    color: ${(props) => props.theme.colors.highlight};
  }
`;
