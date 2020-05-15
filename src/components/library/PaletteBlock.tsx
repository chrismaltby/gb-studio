import React from "react";
import PropTypes from "prop-types";

type PaletteBlockProps = {
  colors: string[];
  size?: number;
}

const PaletteBlock: React.FC<PaletteBlockProps> = ({ colors, size = 24 }) => (
  <div className="PaletteBlock" style={{
    width: size,
    height: size
  }}>
    {colors.map((color, index) =>
      <div key={index} className="PaletteBlock__Color" style={{
        backgroundColor: `#${color}`,
        width: (size / 2) - 1,
        height: (size / 2) - 1
      }} />
    )}
  </div>
);

PaletteBlock.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  size: PropTypes.number
};

export default PaletteBlock;
