import React, { FC, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";
import l10n from "../../lib/helpers/l10n";
import { RootState } from "../../store/configureStore";
import {
  paletteSelectors,
  spriteSheetSelectors,
} from "../../store/features/entities/entitiesState";
import {
  Palette,
  SpriteSheet,
} from "../../store/features/entities/entitiesTypes";
import { SelectMenu, selectMenuStyleProps } from "../ui/form/Select";
import { RelativePortal } from "../ui/layout/RelativePortal";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import { SpriteSheetSelect } from "./SpriteSheetSelect";

interface SpriteSheetSelectProps {
  name: string;
  value?: string;
  direction?: string;
  includeInfo?: boolean;
  frame?: number;
  paletteId?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
}

interface WrapperProps {
  includeInfo?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: relative;
  display: flex;
  min-width: 0;
  ${(props) =>
    props.includeInfo
      ? css`
          width: 100%;
        `
      : ""}
`;

const ButtonCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 54px;
  height: 54px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 1px;
  box-sizing: border-box;
  height: 54px;
  width: 54px;
  flex-shrink: 0;

  :hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  :focus,
  &&&:focus:not(.focus-visible) {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight} !important;
  }

  canvas {
    width: 48px;
    image-rendering: pixelated;
  }
`;

const SpriteInfo = styled.div`
  margin-left: 5px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  font-size: 11px;
`;

const SpriteInfoRow = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex-grow: 1;
`;

const SpriteInfoField = styled.span`
  font-weight: bold;
  margin-right: 5px;
`;

const NoValue = styled.div`
  width: 24px;
`;

const typeLabel = (spriteSheet?: SpriteSheet): string => {
  if (!spriteSheet) {
    return "";
  }
  if (spriteSheet.type === "actor_animated" || spriteSheet.type === "actor") {
    return l10n("ACTOR");
  }
  return l10n("FIELD_MOVEMENT_STATIC");
};

export const SpriteSheetSelectButton: FC<SpriteSheetSelectProps> = ({
  name,
  value,
  direction,
  frame,
  paletteId,
  onChange,
  includeInfo,
  optional,
  optionalLabel,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, value || "")
  );
  const palette = useSelector((state: RootState) =>
    paletteSelectors.selectById(state, paletteId || "")
  );
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

  return (
    <Wrapper includeInfo={includeInfo}>
      <Button
        id={name}
        ref={buttonRef}
        onClick={openMenu}
        onFocus={onButtonFocus}
        onBlur={onButtonBlur}
      >
        {spriteSheet ? (
          <SpriteSheetCanvas
            spriteSheetId={value}
            direction={direction}
            frame={frame}
            palette={palette}
          />
        ) : (
          <NoValue />
        )}
      </Button>
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}
      <SpriteInfo>
        <SpriteInfoRow>
          <SpriteInfoField>{l10n("FIELD_NAME")}:</SpriteInfoField>
          {spriteSheet?.name}
        </SpriteInfoRow>
        <SpriteInfoRow>
          <SpriteInfoField>{l10n("FIELD_SPRITE_FRAMES")}:</SpriteInfoField>
          {spriteSheet?.numFrames}
        </SpriteInfoRow>
        <SpriteInfoRow>
          <SpriteInfoField>{l10n("FIELD_TYPE")}:</SpriteInfoField>
          {typeLabel(spriteSheet)}
        </SpriteInfoRow>
      </SpriteInfo>
      <div style={{ position: "absolute", top: "100%", left: "0%" }}>
        <RelativePortal pin="top-left">
          {isOpen && (
            <SelectMenu>
              <SpriteSheetSelect
                name={name}
                value={value}
                frame={frame}
                direction={direction}
                paletteId={paletteId}
                onChange={onSelectChange}
                onBlur={closeMenu}
                optional={optional}
                optionalLabel={optionalLabel}
                {...selectMenuStyleProps}
              />
            </SelectMenu>
          )}
        </RelativePortal>
      </div>
    </Wrapper>
  );
};
