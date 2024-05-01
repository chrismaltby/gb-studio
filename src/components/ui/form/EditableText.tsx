import styled from "styled-components";

export const EditableText = styled.input`
  color: ${(props) => props.theme.colors.text};
  border: 1px solid transparent;
  background: transparent;
  padding: 5px;
  font-size: 14px;
  height: 30px;
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

export const EditableTextOverlay = styled.div`
  position: relative;
  color: ${(props) => props.theme.colors.text};
  border: 1px solid transparent;
  background: ${(props) => props.theme.colors.sidebar.background};
  padding: 5px;
  font-size: 14px;
  height: 30px;
  line-height: 30px;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  font-weight: bold;
  margin-top: -30px;
  pointer-events: none;
  display: flex;
  align-items: center;
  z-index: 1;

  :focus {
    background: ${(props) => props.theme.colors.input.background};
    color: ${(props) => props.theme.colors.input.text};
    border: 1px solid ${(props) => props.theme.colors.highlight};
  }

  ${EditableText}:hover ~ &,
  ${EditableText}:focus ~ & {
    opacity: 0;
  }
`;
