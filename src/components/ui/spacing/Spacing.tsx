import styled from "styled-components";

export interface FixedSpacerProps {
  width: number;
}

export const FlexGrow = styled.div`
  flex-grow: 1;
`;

export const FixedSpacer = styled.div<FixedSpacerProps>`
  width: ${props => props.width}px;
  flex-shrink: 0;
`;
