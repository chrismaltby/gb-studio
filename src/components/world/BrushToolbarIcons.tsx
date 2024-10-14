import styled, { css } from "styled-components";
import { COLLISIONS_EXTRA_SYMBOLS } from "consts";


interface BrushToolbarBackgroundColorProps {
  $color: string;
}

export const brushToolbarCollisionTileStyles = css`
  position: relative;
  background-color: ${(props) => props.theme.colors.input.background};
  width: 24px;
  height: 24px;
  border: 1px solid ${(props) => props.theme.colors.input.background};
  box-sizing: border-box;
  border-radius: 4px;
}`;

export const BrushToolbarTileSolidIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    display: block;
    background-color: ${(props) => props.$color};
    height: 20px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileTopIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    display: block;
    background-color: ${(props) => props.$color};
    height: 10px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileBottomIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    display: block;
    background-color: ${(props) => props.$color};
    height: 10px;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-top: 10px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileLeftIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    display: block;
    background-color: ${(props) => props.$color};
    width: 10px;
    height: 20px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileRightIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    display: block;
    background-color: ${(props) => props.$color};
    width: 10px;
    height: 20px;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-left: 10px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarLadderTileIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    display: block;
    width: 10px;
    height: 18px;
    margin-left: 2px;
    margin-top: 2px;
    border-left: 4px solid green;
    border-right: 4px solid green;
  }
  &:after {
    position: absolute;
    content: "";
    display: block;
    width: 18px;
    height: 6px;
    left: 2px;
    top: 4px;
    border-top: 4px solid green;
    border-bottom: 4px solid green;
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope45RightIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope45LeftIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(0% 100%, 0% 0%, 100% 100%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope22RightBottomIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(0% 100%, 100% 50%, 100% 100%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope22RightTopIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(0% 50%, 100% 0%, 100% 50%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope22LeftBottomIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(0% 100%, 0% 50%, 100% 100%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope22LeftTopIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(0% 50%, 0% 0%, 100% 50%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope67RightBottomIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(0% 100%, 50% 25%, 50% 100%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope67RightTopIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(50% 75%, 100% 0%, 100% 75%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope67LeftBottomIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(100% 100%, 50% 25%, 50% 100%);
  }
  ${brushToolbarCollisionTileStyles};
`;

export const BrushToolbarTileSlope67LeftTopIcon = styled.div<BrushToolbarBackgroundColorProps>`
  &:before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: ${(props) => props.$color};
    clip-path: polygon(50% 75%, 0% 0%, 0% 75%);
  }
  ${brushToolbarCollisionTileStyles};
`;

interface BrushToolbarExtraTileIconProps {
  $value: string;
  $color: string;
}


export const BrushToolbarExtraTileIcon = styled.div<BrushToolbarExtraTileIconProps>`
  &:before {
    content: "${(props) => props.$value}";
    display: flex;
    width: 22px;
    height: 22px;
    line-height: 22px;
    align-items: center;
    justify-content: center;
    font: 16px "Public Pixel";
    background-color: ${(props) => props.$color};
    color: ${(props) => {
      const c = props.$color;
      const a = c.length <= 7 ? 1.0 : Number("0x"+c.slice(7,9)) / 255.0;
      return a < 0.8 ? c.slice(0,7)+"FF" : "#FFFFFFFF";
    }}
  }
  ${brushToolbarCollisionTileStyles};
`;
