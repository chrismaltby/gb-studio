import React from "react";
import styled, { css } from "styled-components";
import { MinusIcon, PlusIcon } from "../icons/Icons";

export interface ZoomButtonProps {
  readonly zoom: number;
  readonly size?: "small" | "medium";
  readonly variant?: "normal" | "transparent";
  readonly title?: string;
  readonly titleIn?: string;
  readonly titleOut?: string;
  readonly onZoomIn?: () => void;
  readonly onZoomOut?: () => void;
  readonly onZoomReset?: () => void;
}

interface ZoomInnerButtonProps {
  readonly pin: "left" | "right";
}

interface ZoomLabelProps {
  readonly size?: "small" | "medium";
  readonly variant?: "normal" | "transparent";
}

const ZoomButtonWrapper = styled.div`
  position: relative;
  width: fit-content;
`;

const ZoomInnerButton = styled.button<ZoomInnerButtonProps>`
  position: absolute;
  top: 5px;
  left: ${(props) => (props.pin === "left" ? "4px" : "auto")};
  right: ${(props) => (props.pin === "right" ? "4px" : "auto")};
  display: block;
  background: ${(props) => props.theme.colors.button.nestedBackground};
  border-radius: 20px;
  height: 16px;
  width: 16px;
  line-height: 16px;
  padding: 0;
  border: 0;
  flex-shrink: 0;

  :active {
    background: ${(props) => props.theme.colors.button.nestedActiveBackground};
  }

  :after {
    content: "";
    position: absolute;
    left: -4px;
    top: -2px;
    display: block;
    width: 24px;
    height: 20px;
    opacity: 0;
  }

  & > svg {
    width: 8px;
    height: 8px;
    fill: ${(props) => props.theme.colors.button.text};
  }
`;

const ZoomLabel = styled.button<ZoomLabelProps>`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 13px;
  border-radius: ${(props) => props.theme.borderRadius}px;
  width: 98px;
  height: 26px;
  flex-shrink: 0;
  white-space: nowrap;
  box-sizing: border-box;
  font-weight: normal;
  border-width: 1px;
  overflow: hidden;

  -webkit-app-region: no-drag;
  background: ${(props) => props.theme.colors.button.background};
  border: 1px solid ${(props) => props.theme.colors.button.toolbar.border};
  border-top: 1px solid
    ${(props) => props.theme.colors.button.toolbar.borderTop};
  color: ${(props) => props.theme.colors.button.text};
  padding: 0px 5px;

  :active {
    background: ${(props) => props.theme.colors.button.activeBackground};
  }

  ${(props) => (props.size === "small" ? smallStyles : "")}

  ${(props) =>
    props.variant === "transparent"
      ? css`
          background: transparent;
          border: 0;
        `
      : ""}
`;

const smallStyles = css`
  font-size: 11px;
  width: 80px;
`;

export const ZoomButton: React.FC<ZoomButtonProps> = ({
  zoom,
  title,
  titleIn,
  titleOut,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  size,
  variant,
}) => (
  <ZoomButtonWrapper
    title={title}
    onClick={(event) => {
      event.stopPropagation();
      onZoomReset?.();
    }}
  >
    <ZoomInnerButton
      title={titleOut}
      pin="left"
      onClick={(event) => {
        event.stopPropagation();
        onZoomOut?.();
      }}
    >
      <MinusIcon />
    </ZoomInnerButton>
    <ZoomLabel size={size} variant={variant}>
      {zoom}%
    </ZoomLabel>
    <ZoomInnerButton
      title={titleIn}
      pin="right"
      onClick={(event) => {
        event.stopPropagation();
        onZoomIn?.();
      }}
    >
      <PlusIcon />
    </ZoomInnerButton>
  </ZoomButtonWrapper>
);

ZoomButton.defaultProps = {
  zoom: 100,
  size: "medium",
};
