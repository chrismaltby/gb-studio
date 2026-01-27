import React from "react";

interface MetaspriteGridProps {
  originX: number;
  originY: number;
  width: number;
  height: number;
  showGrid: boolean;
  darkBackground: boolean;
  gridSize: number;
  zoom: number;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const generateGridBackground = (
  zoom: number,
  lineColor = "#efefef",
  borderColor = "#d4d4d4",
): string => {
  if (zoom < 8) {
    return `linear-gradient(to right, ${lineColor} 1px, transparent 1px), 
            linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`;
  }

  const pixelLines = Array.from({ length: 8 }, (_, i) => {
    const start = i * zoom;
    return `${lineColor} ${start + 0}px, transparent ${start + 0}px, transparent ${start + zoom - 1}px`;
  }).join(", ");

  return `linear-gradient(to right, ${borderColor} 1px, ${pixelLines}), 
          linear-gradient(to bottom, ${borderColor} 1px, ${pixelLines})`;
};

const MetaspriteGrid = ({
  originX,
  originY,
  width,
  height,
  gridSize,
  showGrid,
  darkBackground,
  zoom,
  onClick,
  children,
}: MetaspriteGridProps) => {
  // When canvas width is not 8 or a multiple of 16 then
  // an offset is needed to align grid lines correctly
  const offsetGridX = width % 16 !== 0 && width !== 8 ? `${4 * zoom}px` : "0";

  const backgroundColor = darkBackground ? "#000" : "#fff";
  const borderColor = darkBackground ? "#343434" : "#d4d4d4";
  const lineColor = darkBackground ? "#343434" : "#d4d4d4";

  return (
    <div
      style={{
        position: "relative",
        width: width * zoom,
        height: height * zoom,
        background: backgroundColor,
      }}
    >
      {showGrid && (
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            left: (Math.max(0, width / 2 - 8) + originX) * zoom,
            bottom: (8 - originY - 8) * zoom,
            width: (width < 16 ? 8 : 16) * zoom,
            height: 8 * zoom,
            background: "rgba(0, 188, 212, 0.4)",
          }}
        />
      )}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: `${1 / zoom}px solid ${borderColor}`,
          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          backgroundPositionX: offsetGridX,
          backgroundImage: showGrid
            ? generateGridBackground(zoom, lineColor, borderColor)
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
        onMouseDown={onClick}
      />
      <div
        style={{
          position: "relative",
          width,
          transform: `translate3d(${Math.max(0, width / 2 - 8) * zoom}px, ${
            height * zoom
          }px, 0) scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
      {showGrid && (
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            left: (Math.max(0, width / 2 - 8) + originX - 1) * zoom,
            bottom: (8 - originY - 1) * zoom,
            width: 2 * zoom,
            height: 2 * zoom,
            background: "rgba(255, 0, 0, 0.6)",
          }}
        />
      )}
    </div>
  );
};

export default MetaspriteGrid;
