import React from "react";

interface MetaspriteGridProps {
  width: number;
  height: number;
  showGrid: boolean;
  gridSize: number;
  zoom: number;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const MetaspriteGrid = ({
  width,
  height,
  gridSize,
  showGrid,
  zoom,
  onClick,
  children,
}: MetaspriteGridProps) => {
  return (
    <div
      style={{
        position: "relative",
        width: width * zoom,
        height: height * zoom,
        background: "#fff",
      }}
    >
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          bottom: 0,
          left: (width / 2 - 8) * zoom,
          width: 16 * zoom,
          height: 8 * zoom,
          background: "rgba(0, 188, 212, 0.4)",
        }}
      />
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: `${1 / zoom}px solid #d4d4d4`,
          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          backgroundImage:
            (showGrid &&
              (zoom >= 8
                ? `linear-gradient(to right, 
          #d4d4d4 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          ), linear-gradient(to bottom, 
          #d4d4d4 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          )`
                : "linear-gradient(to right, #efefef 1px, transparent 1px), linear-gradient(to bottom, #efefef 1px, transparent 1px)")) ||
            "none",
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
          transform: `translate3d(${(width / 2 - 8) * zoom}px, ${
            height * zoom
          }px, 0) scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MetaspriteGrid;
