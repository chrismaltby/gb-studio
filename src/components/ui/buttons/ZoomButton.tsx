import React from "react";
import {
  StyledZoomButton,
  StyledZoomInnerButton,
  StyledZoomLabel,
} from "ui/buttons/style";
import { MinusIcon, PlusIcon } from "ui/icons/Icons";

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

export const ZoomButton: React.FC<ZoomButtonProps> = ({
  zoom = 100,
  title,
  titleIn,
  titleOut,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  size = "medium",
  variant,
}) => (
  <StyledZoomButton
    title={title}
    onClick={(event) => {
      event.stopPropagation();
      onZoomReset?.();
    }}
  >
    <StyledZoomInnerButton
      title={titleOut}
      $pin="left"
      onClick={(event) => {
        event.stopPropagation();
        onZoomOut?.();
      }}
    >
      <MinusIcon />
    </StyledZoomInnerButton>
    <StyledZoomLabel $size={size} $variant={variant}>
      {zoom}%
    </StyledZoomLabel>
    <StyledZoomInnerButton
      title={titleIn}
      $pin="right"
      onClick={(event) => {
        event.stopPropagation();
        onZoomIn?.();
      }}
    >
      <PlusIcon />
    </StyledZoomInnerButton>
  </StyledZoomButton>
);
