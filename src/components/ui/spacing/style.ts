import styled from "styled-components";

export interface StyledFixedSpacerProps {
  $width?: number;
  $height?: number;
}

export const StyledFlexGrow = styled.div`
  flex-grow: 1;
`;

export const StyledFixedSpacer = styled.div<StyledFixedSpacerProps>`
  width: ${(props) => (props.$width ? props.$width : 1)}px;
  height: ${(props) => (props.$height ? props.$height : 1)}px;
  flex-shrink: 0;
`;

export const StyledFlexBreak = styled.div`
  flex-basis: 100% !important;
  margin: 0 !important;
  height: 0;
`;

export const StyledFlexRow = styled.div`
  display: flex;
`;
