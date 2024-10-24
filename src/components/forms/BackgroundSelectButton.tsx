import React, { FC, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import assetsActions from "store/features/assets/assetsActions";
import {
  FormatFolderLabel,
  SelectMenu,
  selectMenuStyleProps,
} from "ui/form/Select";
import { Palette, MonoPalette } from "shared/lib/entities/entitiesTypes";
import { RelativePortal } from "ui/layout/RelativePortal";
import { BackgroundSelect } from "./BackgroundSelect";
import { assetURL, assetURLStyleProp } from "shared/lib/helpers/assets";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DMG_PALETTE, MAX_BACKGROUND_TILES, MAX_BACKGROUND_TILES_CGB, TILE_SIZE } from "consts";
import { monoOverrideForFilename } from "shared/lib/assets/backgrounds";
import { FlexGrow } from "ui/spacing/Spacing";
import AutoColorizedImage from "components/world/AutoColorizedImage";
import ColorizedImage from "components/world/ColorizedImage";

interface BackgroundSelectProps {
  name: string;
  value?: string;
  is360: boolean;
  tilesetId: string;
  includeInfo?: boolean;
  onChange?: (newId: string) => void;
  palettes?: Palette[];
  previewAsMono?: boolean;
  monoPalette?: MonoPalette;
}

interface WrapperProps {
  $includeInfo?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: relative;
  display: flex;
  min-width: 0;
  width: 67px;
  ${(props) =>
    props.$includeInfo
      ? css`
          width: 100%;
        `
      : ""}

  & * {
    min-width: 0;
  }
`;

const Thumbnail = styled.div`
  width: 55px;
  height: 50px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
`;

const ButtonCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
`;

const Button = styled.button`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  text-align: left;

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

const ButtonContent = styled.div`
  display: flex;
  width: 100%;
  height: 60px;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 5px;
`;

const SpriteInfo = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 5px;
  width: 100%;
  font-size: 11px;
  height: 100%;
`;

const SpriteInfoTitle = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex-grow: 1;
  font-weight: bold;
`;

interface SpriteInfoRowProps {
  $error?: boolean;
}

const SpriteInfoRow = styled.div<SpriteInfoRowProps>`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 9px;
  line-height: 10px;
  opacity: 0.7;

  ${(props) =>
    props.$error
      ? css`
          color: red;
        `
      : ""}
`;

const SpriteInfoField = styled.span`
  margin-right: 5px;
`;

const NoValue = styled.div`
  width: 24px;
`;

export const Pill = styled.span`
  position: absolute;
  top: 5px;
  left: 2px;
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 3px;
  padding: 0px 3px;
  margin-left: 3px;
  font-size: ${(props) => props.theme.typography.fontSize};

  &:active {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }
`;

export const BackgroundSelectButton: FC<BackgroundSelectProps> = ({
  name,
  value,
  onChange,
  is360,
  tilesetId,
  includeInfo,
  palettes,
  previewAsMono,
  monoPalette,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, value || "")
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);
  const numTiles = useAppSelector(
    (state) => state.assets.backgrounds[value || ""]?.numTiles
  );
  const isCGBOnly = useAppSelector(
    (state) => state.project.present.settings.colorMode === "color"
  );
  const isColor = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono"
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (value) {
      dispatch(
        assetsActions.loadBackgroundAssetInfo({
          backgroundId: value,
          tilesetId,
          is360,
        })
      );
    }
  }, [dispatch, value, is360, tilesetId]);

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

  const defaultPalettes = [0,1,2,3,4,5,6,7].map(i => DMG_PALETTE);

  return (
    <Wrapper $includeInfo={includeInfo}>
      <Button
        id={name}
        ref={buttonRef}
        onClick={openMenu}
        onFocus={onButtonFocus}
        onBlur={onButtonBlur}
      >
        <ButtonContent>
          {/* {!previewAsMono && isColor && background.autoColor ? (
            <AutoColorizedImage
              width={background.width * TILE_SIZE}
              height={background.height * TILE_SIZE}
              src={assetURL("backgrounds", background)}
            />
          ) : (
            <ColorizedImage
              width={background.width * TILE_SIZE}
              height={background.height * TILE_SIZE}
              src={assetURL("backgrounds", background)}
              tiles={background.tileColors}
              palettes={palettes ?? defaultPalettes}
              previewAsMono={previewAsMono}
              monoPalette={monoPalette}
            />
          )} */}
          {background ? (
            <Thumbnail
              style={{
                backgroundImage:
                  background && assetURLStyleProp("backgrounds", background),
              }}
            />
          ) : (
            <NoValue />
          )}
          {includeInfo && (
            <SpriteInfo>
              <SpriteInfoTitle>
                <FormatFolderLabel label={background?.name} />
                {isColor && background?.autoColor && background.monoOverrideId && (
                  <Pill
                    title={l10n("FIELD_MONO_OVERRIDE_DESC", {
                      filename: background.filename,
                      tilesFilename: monoOverrideForFilename(
                        background.filename
                      ),
                    })}
                  >
                    +
                  </Pill>
                )}
              </SpriteInfoTitle>
              <FlexGrow />
              <SpriteInfoRow>
                <SpriteInfoField>{l10n("FIELD_SIZE")}:</SpriteInfoField>
                {background?.width}x{background?.height}
              </SpriteInfoRow>
              <SpriteInfoRow
                $error={
                  (numTiles > MAX_BACKGROUND_TILES_CGB ||
                    (!isCGBOnly && numTiles > MAX_BACKGROUND_TILES)) &&
                  !is360
                }
              >
                <SpriteInfoField>{l10n("FIELD_TILES")}:</SpriteInfoField>
                {numTiles}
              </SpriteInfoRow>
              <FlexGrow />
            </SpriteInfo>
          )}
        </ButtonContent>
      </Button>
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}

      <div style={{ position: "absolute", top: "100%", left: "100%" }}>
        {isOpen && (
          <RelativePortal pin="top-right">
            <SelectMenu>
              <BackgroundSelect
                name={name}
                value={value}
                onChange={onSelectChange}
                onBlur={closeMenu}
                {...selectMenuStyleProps}
              />
            </SelectMenu>
          </RelativePortal>
        )}
      </div>
    </Wrapper>
  );
};
