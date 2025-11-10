import React from "react";
import styled from "styled-components";
import PaletteBlock from "components/forms/PaletteBlock";
import { Palette } from "shared/lib/entities/entitiesTypes";
import { LockIcon } from "ui/icons/Icons";

type AutoPaletteSwatchProps = {
  palette: Palette | undefined;
};

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  min-width: 0;
  flex-shrink: 0;
  & * {
    min-width: 0;
  }

  svg {
    position: absolute;
    top: 22px;
    right: -1px;
    width: 8px;
    height: 8px;
    fill: ${(props) => props.theme.colors.button.text};
    background: ${(props) => props.theme.colors.input.border};
    border-radius: ${(props) => props.theme.borderRadius}px;
    padding: 2px;
  }
`;

const Button = styled.div`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 1px;
  box-sizing: border-box;
  height: 28px;
  flex-shrink: 0;

  &:hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  &:focus,
  &&&:focus:not(.focus-visible) {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight} !important;
  }
`;

export const AutoPaletteSwatch = ({ palette }: AutoPaletteSwatchProps) => {
  return (
    <Wrapper>
      <Button title={palette?.name}>
        <PaletteBlock type="tile" colors={palette?.colors || []} size={22} />
      </Button>
      <LockIcon />
    </Wrapper>
  );
};
