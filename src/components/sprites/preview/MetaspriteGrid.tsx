import React from "react";
import styled from "styled-components";

interface MetaspriteGridProps {
  width: number;
  height: number;
  gridSize: number;
  zoom: number;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const MetaspriteGrid = ({
  width,
  height,
  gridSize,
  zoom,
  onClick,
  children,
}: MetaspriteGridProps) => {
  return (
    <div
      style={{
        width: width * zoom,
        height: height * zoom,
        border: `${1 / zoom}px solid #d4d4d4`,
        background: "#fff",
        backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
        backgroundImage:
          zoom >= 8
            ? `linear-gradient(to right, 
          #d4d4d4 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          ), linear-gradient(to bottom, 
          #d4d4d4 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          )`
            : "linear-gradient(to right, #efefef 1px, transparent 1px), linear-gradient(to bottom, #efefef 1px, transparent 1px)",
      }}
    >
      <div
        style={{
          position: "relative",
          width,
          height,
          transform: `translate3d(0, 0, 0) scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
          onClick={onClick}
        />
        {children}
      </div>
    </div>
  );
};

export default MetaspriteGrid;
