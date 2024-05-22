import styled from "styled-components";

export const Selection = styled.div`
  position: absolute;
  background: rgba(128, 128, 128, 0.2);
  outline: 2px solid ${(props) => props.theme.colors.highlight};
  z-index: 1000;
`;
