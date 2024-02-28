import styled, { css } from "styled-components";

export const brushToolbarCollisionTileStyles = css`
  position: relative;
  background-color: var(--input-bg-color);
  width: 24px;
  height: 24px;
  border: 1px solid var(--input-bg-color);
  box-sizing: border-box;
  border-radius: 4px;
}`;

export const BrushToolbarTileSolidIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    display: block;
    background-color: rgb(250, 40, 40);
    height: 20px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
`;

export const BrushToolbarTileTopIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    display: block;
    background-color: rgb(40, 40, 255);
    height: 10px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
`;

export const BrushToolbarTileBottomIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    display: block;
    background-color: rgb(255, 255, 40);
    height: 10px;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-top: 10px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
`;

export const BrushToolbarTileLeftIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    display: block;
    background-color: rgb(255, 40, 255);
    width: 10px;
    height: 20px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
`;

export const BrushToolbarTileRightIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    display: block;
    background-color: rgb(40, 255, 255);
    width: 10px;
    height: 20px;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-left: 10px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
`;

export const BrushToolbarLadderTileIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    display: block;
    width: 10px;
    height: 18px;
    margin-left: 2px;
    margin-top: 2px;
    border-left: 4px solid green;
    border-right: 4px solid green;
  }

  ::after {
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
`;

export const BrushToolbarTileSlope45RightIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: blue;
    clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
  }
`;

export const BrushToolbarTileSlope45LeftIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: blue;
    clip-path: polygon(0% 100%, 0% 0%, 100% 100%);
  }
`;

export const BrushToolbarTileSlope22RightBottomIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: green;
    clip-path: polygon(0% 100%, 100% 50%, 100% 100%);
  }
`;

export const BrushToolbarTileSlope22RightTopIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: green;
    clip-path: polygon(0% 50%, 100% 0%, 100% 50%);
  }
`;

export const BrushToolbarTileSlope22LeftBottomIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: green;
    clip-path: polygon(0% 100%, 0% 50%, 100% 100%);
  }
`;

export const BrushToolbarTileSlope22LeftTopIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: green;
    clip-path: polygon(0% 50%, 0% 0%, 100% 50%);
  }
`;

export const BrushToolbarTileSlope67RightBottomIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: fuchsia;
    clip-path: polygon(0% 100%, 50% 25%, 50% 100%);
  }
`;

export const BrushToolbarTileSlope67RightTopIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: fuchsia;
    clip-path: polygon(50% 75%, 100% 0%, 100% 75%);
  }
`;

export const BrushToolbarTileSlope67LeftBottomIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: cyan;
    clip-path: polygon(100% 100%, 50% 25%, 50% 100%);
  }
`;

export const BrushToolbarTileSlope67LeftTopIcon = styled.div`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "";
    width: 20px;
    height: 20px;
    display: block;
    background-color: cyan;
    clip-path: polygon(50% 75%, 0% 0%, 0% 75%);
  }
`;

interface BrushToolbarExtraTileIconProps {
  value: string;
}

export const BrushToolbarExtraTileIcon = styled.div<BrushToolbarExtraTileIconProps>`
  ${brushToolbarCollisionTileStyles}

  ::before {
    content: "${(props) => props.value}";
    display: flex;
    width: 22px;
    height: 22px;
    line-height: 22px;
    align-items: center;
    justify-content: center;
  }
`;
