import styled from "styled-components";

// #region EntityListItem

interface StyledEntityListItemProps {
  $nestLevel?: number;
}

interface StyledNavigatorArrowProps {
  $open: boolean;
}

interface StyledEntityLabelColorProps {
  $color: string;
}

export const StyledEntityListItem = styled.div<StyledEntityListItemProps>`
  display: flex;
  align-items: center;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  padding-left: ${(props) => (props.$nestLevel || 0) * 15}px;
`;

export const StyledNavigatorArrow = styled.span<StyledNavigatorArrowProps>`
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  margin-left: -5px;

  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 8px;
    height: 8px;
    transform: rotate(${(props) => (props.$open ? 90 : 0)}deg);
  }
`;

export const StyledEntityIcon = styled.div`
  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 10px;
    height: 10px;
    margin-right: 5px;
    opacity: 0.5;
  }
`;

export const StyledEntityLabel = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
`;

export const StyledEntityWarningLabel = styled.span`
  color: red;
`;

export const StyledEntityLabelColor = styled.div.attrs<StyledEntityLabelColorProps>(
  (props) => ({
    className: `label--${props.$color}`,
  })
)`
  width: 10px;
  height: 10px;
  border-radius: 10px;
  flex-shrink: 0;
  margin-left: 5px;
`;

// #endregion EntityListItem
