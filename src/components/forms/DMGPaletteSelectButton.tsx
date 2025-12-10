import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { MonoBGPPalette, MonoOBJPalette } from "shared/lib/resources/types";
import PaletteBlock from "components/forms/PaletteBlock";
import { DMG_PALETTE } from "consts";
import { RelativePortal } from "ui/layout/RelativePortal";
import { DMGPaletteSelectModal } from "components/forms/DMGPaletteSelectModal";
import { SelectMenu } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { components } from "react-select";

type DMGPaletteSelectButtonVariant = "default" | "select";

type PaletteKind =
  | { isSpritePalette: true; value: MonoOBJPalette }
  | { isSpritePalette?: false; value: MonoBGPPalette };

type Optionality<T> =
  | {
      isOptional: true;
      defaultValue?: undefined;
      onChange: (value: T | undefined) => void;
    }
  | { isOptional?: false; defaultValue: T; onChange: (value: T) => void };

type PaletteProps<K extends PaletteKind> = K extends { value: infer V }
  ? K & Optionality<V>
  : never;

type DMGPaletteSelectButtonProps = {
  name: string;
  label?: string;
  showName?: boolean;
  variant?: DMGPaletteSelectButtonVariant;
} & (
  | PaletteProps<{ isSpritePalette: true; value: MonoOBJPalette }>
  | PaletteProps<{ isSpritePalette?: false; value: MonoBGPPalette }>
);

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-shrink: 0;
  & * {
    min-width: 0;
  }

  svg {
    fill: hsl(0, 0%, 80%);
  }
`;

const ModalCloseCover = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
`;

const ButtonCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 38px;
  z-index: 1000;
`;

const LabelOuter = styled.div`
  position: absolute;
  width: 28px;
  bottom: -1px;
  left: 0px;
  opacity: 0.5;
  color: ${(props) => props.theme.colors.button.text};
  font-size: 9px;
  text-align: center;
`;

const LabelInner = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  color: ${(props) => props.theme.colors.input.text};
  height: 100%;
  margin-left: 5px;
`;

const Button = styled.button<{
  variant?: DMGPaletteSelectButtonVariant;
}>`
  display: flex;
  position: relative;
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

  ${(props) =>
    props.variant === "default"
      ? `
        margin-bottom: 10px;
      `
      : ``}
`;

const DownChevron = components.DownChevron;

export const DMGPaletteSelectButton = ({
  name,
  label,
  value,
  isSpritePalette,
  onChange,
  isOptional,
  defaultValue,
  variant = "default",
}: DMGPaletteSelectButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);

  useEffect(() => {
    if (buttonFocus) {
      window.addEventListener("keydown", onKeyDownClosed);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDownClosed);
    };
  }, [buttonFocus]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", onKeyDownOpen);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDownOpen);
    };
  }, [isOpen]);

  const onKeyDownClosed = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setIsOpen(true);
    }
  };

  const onKeyDownOpen = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const openMenu = () => {
    setIsOpen(true);
    cancelDelayedButtonFocus();
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const onButtonFocus = () => {
    setButtonFocus(true);
  };

  const onButtonBlur = () => {
    setButtonFocus(false);
  };

  const delayedButtonFocus = () => {
    timerRef.current = setTimeout(() => {
      buttonRef.current?.focus();
    }, 100);
  };

  const cancelDelayedButtonFocus = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const onReset = () => {
    if (isOptional) {
      onChange(undefined);
    } else if (isSpritePalette) {
      onChange(defaultValue);
    } else {
      onChange(defaultValue);
    }
  };

  const currentColors = useMemo(() => {
    if (isSpritePalette) {
      return [
        DMG_PALETTE.colors[value[0]],
        DMG_PALETTE.colors[value[1]],
        DMG_PALETTE.colors[value[1]],
        DMG_PALETTE.colors[value[2]],
      ];
    }
    return [
      DMG_PALETTE.colors[value[0]],
      DMG_PALETTE.colors[value[1]],
      DMG_PALETTE.colors[value[2]],
      DMG_PALETTE.colors[value[3]],
    ];
  }, [isSpritePalette, value]);

  return (
    <Wrapper>
      {variant === "default" && label && <LabelOuter>{label}</LabelOuter>}
      <Button
        id={name}
        ref={buttonRef}
        onClick={openMenu}
        onFocus={onButtonFocus}
        onBlur={onButtonBlur}
        title={
          label ? `${l10n("FIELD_MONOCHROME_PALETTE")}: ${label}` : undefined
        }
        variant={variant}
      >
        <PaletteBlock
          type={isSpritePalette ? "sprite" : "tile"}
          colors={currentColors}
          size={22}
        />
        {variant === "select" && label && (
          <>
            <LabelInner>
              {l10n("FIELD_MONOCHROME_PALETTE")}: {label}
            </LabelInner>
            <DownChevron />
          </>
        )}
      </Button>
      {isOpen && (
        <ModalCloseCover
          onMouseDown={(e) => {
            closeMenu();
            const el = e.currentTarget;
            const { clientX: x, clientY: y } = e;
            el.style.pointerEvents = "none";
            const elemBelow = document.elementFromPoint(x, y);
            if (elemBelow) {
              elemBelow.dispatchEvent(
                new MouseEvent("click", {
                  clientX: x,
                  clientY: y,
                  view: window,
                  bubbles: true,
                  cancelable: true,
                }),
              );
            }
          }}
        />
      )}
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}
      <RelativePortal pin="top-left" offsetX={0} offsetY={-1}>
        {isOpen && (
          <SelectMenu>
            {isSpritePalette ? (
              <DMGPaletteSelectModal
                name={name}
                label={label}
                value={value}
                isSpritePalette
                onChange={onChange}
                onBlur={closeMenu}
                onReset={onReset}
                showName={variant === "default"}
              />
            ) : (
              <DMGPaletteSelectModal
                name={name}
                label={label}
                value={value}
                onChange={onChange}
                onBlur={closeMenu}
                onReset={onReset}
                showName={variant === "default"}
              />
            )}
          </SelectMenu>
        )}
      </RelativePortal>
    </Wrapper>
  );
};
