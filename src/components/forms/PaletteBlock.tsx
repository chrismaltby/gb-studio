import React from "react";
import styled, { css } from "styled-components";

export type PaletteBlockType = "tile" | "sprite" | "sgb";

type PaletteBlockProps = {
  colors: string[];
  size?: number;
  type?: PaletteBlockType;
  highlight?: boolean;
};

type WrapperProps = {
  $type?: PaletteBlockType;
  $highlight?: boolean;
};

const Wrapper = styled.div<WrapperProps>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0px 0px;
  border: 1px solid
    ${(props) =>
      props.$highlight
        ? props.theme.colors.highlight
        : props.theme.colors.input.background};
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
  transition: border 0.2s ease-in-out;
  transition-delay: ${(props) => (props.$highlight ? "0.5s" : "0")};
  ${(props) =>
    props.$type === "sprite" || props.$type === "sgb" ? spriteStyles : ""}
`;

const spriteStyles = css`
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
`;

const Color = styled.div``;

const PaletteBlock = ({
  colors,
  size = 24,
  type = "tile",
  highlight,
}: PaletteBlockProps) => (
  <Wrapper
    $type={type}
    $highlight={highlight}
    style={{
      width: size,
      height: size,
    }}
  >
    {colors.map((color, index) => {
      if (type === "sgb" && index === 0) {
        return null;
      }
      if (type === "sprite" && index === 2) {
        return null;
      }
      return (
        <Color
          key={index}
          style={{
            backgroundColor: `#${color}`,
          }}
        />
      );
    })}
  </Wrapper>
);

export default React.memo<PaletteBlockProps>(PaletteBlock);
