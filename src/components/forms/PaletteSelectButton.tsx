import React, { FC, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  getLocalisedDMGPalette,
  getLocalisedPaletteById,
} from "store/features/entities/entitiesState";
import PaletteBlock from "components/forms/PaletteBlock";
import { SelectMenu, selectMenuStyleProps } from "ui/form/Select";
import { RelativePortal } from "ui/layout/RelativePortal";
import { PaletteSelect } from "./PaletteSelect";
import navigationActions from "store/features/navigation/navigationActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Palette } from "shared/lib/entities/entitiesTypes";

type PaletteSelectProps = {
  name: string;
  value?: string;
  type?: "tile" | "sprite";
  onChange?: (newId: string) => void;
  slotNumber?: number;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultPaletteId?: string;
  canAuto?: boolean;
  autoPalette?: Palette;
};

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  min-width: 0;
  flex-shrink: 0;
  & * {
    min-width: 0;
  }
`;

const ButtonCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
`;

const Button = styled.button`
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

const NoValue = styled.div`
  width: 24px;
`;

export const PaletteSelectButton: FC<PaletteSelectProps> = ({
  name,
  value,
  type,
  slotNumber,
  onChange,
  optional,
  optionalLabel,
  optionalDefaultPaletteId,
  canAuto,
  autoPalette,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  let paletteId = value || "";
  if (optional && !value) {
    paletteId = optionalDefaultPaletteId || "";
  }
  if (paletteId === "auto" && !autoPalette) {
    paletteId = optionalDefaultPaletteId || "";
  }

  const palette =
    useAppSelector((state) => getLocalisedPaletteById(state, paletteId)) ||
    (value === "auto" && autoPalette ? autoPalette : getLocalisedDMGPalette());
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);
  const dispatch = useAppDispatch();

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

  const onSelectChange = (newValue: string) => {
    closeMenu();
    onChange?.(newValue);
    buttonRef.current?.focus();
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

  const onJumpToPalette = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.altKey) {
      if (palette) {
        dispatch(navigationActions.setSection("palettes"));
        dispatch(navigationActions.setNavigationId(palette.id || ""));
      }
    }
  };

  return (
    <Wrapper onClick={onJumpToPalette}>
      <Button
        id={name}
        ref={buttonRef}
        onClick={openMenu}
        onFocus={onButtonFocus}
        onBlur={onButtonBlur}
        title={slotNumber ? `${slotNumber}: ${palette.name}` : palette.name}
      >
        {palette ? (
          <PaletteBlock type={type} colors={palette?.colors || []} size={22} />
        ) : (
          <NoValue />
        )}
      </Button>
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}
      <RelativePortal pin="top-right" offsetY={28}>
        {isOpen && (
          <SelectMenu>
            <PaletteSelect
              name={name}
              value={value}
              type={type}
              onChange={onSelectChange}
              onBlur={closeMenu}
              optional={optional}
              optionalLabel={optionalLabel}
              optionalDefaultPaletteId={optionalDefaultPaletteId}
              canAuto={canAuto}
              autoPalette={autoPalette}
              {...selectMenuStyleProps}
            />
          </SelectMenu>
        )}
      </RelativePortal>
    </Wrapper>
  );
};
