import styled from "styled-components";

export const SplitPaneHorizontalDivider = styled.div`
  width: 1px;
  height: 100%;
  background-color: ${(props) => props.theme.colors.sidebar.border};
  cursor: ew-resize;
  position: relative;
  z-index: 1;

  :before {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: -5px;
    width: 10px;
    height: 100%;
  }

  :after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: -4px;
    width: 9px;
    height: 100%;
    background-color: ${(props) => props.theme.colors.sidebar.border};
    opacity: 0.3;
    transform: scale(0, 1);
    transition: all 0.3s ease-in-out;
  }

  :hover:after {
    transform: scale(1, 1);
  }
`;

export const SplitPaneVerticalDivider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${(props) => props.theme.colors.sidebar.border};
  cursor: ns-resize;
  position: relative;
  z-index: 1;

  :before {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    top: -5px;
    height: 10px;
    width: 100%;
  }

  :after {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    top: -4px;
    height: 9px;
    width: 100%;
    background-color: ${(props) => props.theme.colors.sidebar.border};
    opacity: 0.3;
    transform: scale(1, 0);
    transition: all 0.3s ease-in-out;
  }

  :hover:after {
    transform: scale(1, 1);
  }
`;
