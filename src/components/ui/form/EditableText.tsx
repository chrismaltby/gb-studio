import styled from "styled-components";

export const EditableText = styled.input`
  color: ${(props) => props.theme.colors.text};
  border: 1px solid transparent;
  background: transparent;
  padding: 5px;
  font-size: 14px;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  font-weight: bold;

  :hover {
    background: rgba(128, 128, 128, 0.2);
  }

  :focus {
    background: ${(props) => props.theme.colors.input.background};
    color: ${(props) => props.theme.colors.input.text};
    border: 1px solid ${(props) => props.theme.colors.highlight};
  }
`;
