import styled from "styled-components";

export interface FixedSpacerProps {
  width?: number;
  height?: number;
}

export const FlexGrow = styled.div`
  flex-grow: 1;
`;

export const FixedSpacer = styled.div<FixedSpacerProps>`
  width: ${(props) => (props.width ? props.width : 1)}px;
  height: ${(props) => (props.height ? props.height : 1)}px;
  flex-shrink: 0;
`;

export const FlexBreak = styled.div`
  flex-basis: 100% !important;
  margin: 0 !important;
  height: 0;
`;
