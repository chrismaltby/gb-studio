import styled from "styled-components";

export const Tooltip = styled.div`
  color: #000;
  background-color: #fff;
  border-radius: 4px;
  padding: 4px 0;
  overflow: auto;
  box-shadow: 0 0 0 1px rgba(150, 150, 150, 0.3),
    0 4px 11px hsla(0, 0%, 0%, 0.1);
  min-width: 60px;
  z-index: 1001;
  font-size: 11px;
  line-height: normal;
  font-weight: normal;
  padding: 10px;
  max-width: 230px;
  transform: translateX(-10px);
  z-index: 10000;

  p {
    margin: 10px 0;
  }
  p:first-child {
    margin-top: 0;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;
