import React from "react";
import PropTypes from "prop-types";
import styled, { css } from "styled-components";

type PaletteBlockProps = {
  colors: string[];
  size?: number;
  type?: "tile" | "sprite";
  highlight?: boolean;
};

type WrapperProps = {
  type?: "tile" | "sprite";
  highlight?: boolean;
};

const Wrapper = styled.div<WrapperProps>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0px 0px;
  border: 1px solid
    ${(props) =>
      props.highlight
        ? props.theme.colors.highlight
        : props.theme.colors.input.background};
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
  transition: border 0.2s ease-in-out;
  transition-delay: ${(props) => (props.highlight ? "0.5s" : "0")};
  ${(props) => (props.type === "sprite" ? spriteStyles : "")}
`;

const spriteStyles = css`
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
`;

const Color = styled.div``;

const PaletteBlock: React.FC<PaletteBlockProps> = ({
  colors,
  size = 24,
  type = "tile",
  highlight,
}) => (
  <Wrapper
    type={type}
    highlight={highlight}
    style={{
      width: size,
      height: size,
    }}
  >
    {colors.map((color, index) => {
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

PaletteBlock.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  size: PropTypes.number,
};

export default PaletteBlock;
