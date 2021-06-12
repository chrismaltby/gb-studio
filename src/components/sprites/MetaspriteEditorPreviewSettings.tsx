import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store/configureStore";
import {
  metaspriteSelectors,
  sceneSelectors,
  spriteSheetSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import l10n from "lib/helpers/l10n";
import { SceneSelect } from "../forms/SceneSelect";
import { SelectMenu, selectMenuStyleProps } from "ui/form/Select";
import { RelativePortal } from "ui/layout/RelativePortal";
import { sceneName } from "lib/compiler/compileData2";
import { Tooltip, TooltipWrapper } from "ui/tooltips/Tooltip";
import { FixedSpacer } from "ui/spacing/Spacing";

interface MetaspriteEditorPreviewSettingsProps {
  spriteSheetId: string;
  metaspriteId: string;
}

const Wrapper = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 10px;
  left: 10px;
  z-index: 11;
  border-radius: 16px;
  background: ${(props) => props.theme.colors.document.background};
  box-shadow: 0 0 0 2px ${(props) => props.theme.colors.document.background};
  font-size: ${(props) => props.theme.typography.fontSize};
`;

const Pill = styled.button`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: ${(props) => props.theme.typography.fontSize};

  :active {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }
`;

const Info = styled.div`
  color: ${(props) => props.theme.colors.secondaryText};
  padding: 0 5px;
  margin-left: -5px;
  border-radius: 16px;

  :hover {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }
`;

const ButtonCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
`;

const MetaspriteEditorPreviewSettings = ({
  spriteSheetId,
  metaspriteId,
}: MetaspriteEditorPreviewSettingsProps) => {
  const dispatch = useDispatch();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);
  const value = useSelector(
    (state: RootState) => state.editor.previewAsSceneId
  );
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, spriteSheetId)
  );
  const metasprite = useSelector((state: RootState) =>
    metaspriteSelectors.selectById(state, metaspriteId)
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, value)
  );
  const scenes = useSelector((state: RootState) =>
    sceneSelectors.selectIds(state)
  );
  const sceneIndex = scenes.indexOf(value);
  const colorsEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );

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

  const onChange = (newValue: string) => {
    dispatch(editorActions.setPreviewAsSceneId(newValue));
  };

  if (!spriteSheet || !metasprite) {
    return null;
  }

  return (
    <Wrapper>
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}
      {colorsEnabled && (
        <>
          <RelativePortal pin="bottom-left" offsetY={-10}>
            {isOpen && (
              <SelectMenu>
                <SceneSelect
                  name="previewAs"
                  value={value}
                  onChange={onSelectChange}
                  onBlur={closeMenu}
                  maxMenuHeight={200}
                  optional
                  optionalLabel={l10n("FIELD_DEFAULT_COLORS")}
                  {...selectMenuStyleProps}
                />
              </SelectMenu>
            )}
          </RelativePortal>
          <Pill
            ref={buttonRef}
            onClick={openMenu}
            onFocus={onButtonFocus}
            onBlur={onButtonBlur}
          >
            ▲{" "}
            {scene
              ? l10n("FIELD_PREVIEW_AS_SCENE", {
                  sceneName: sceneName(scene, sceneIndex),
                })
              : l10n("FIELD_PREVIEW_AS_DEFAULT")}
          </Pill>
          <FixedSpacer width={10} />
        </>
      )}
      <TooltipWrapper tooltip={l10n("FIELD_SPRITE_TILES_TOOLTIP")}>
        <Info>
          {l10n("FIELD_TILES")}={metasprite.tiles.length}
        </Info>
      </TooltipWrapper>
      <FixedSpacer width={5} />
      <TooltipWrapper tooltip={l10n("FIELD_SPRITE_UNIQUE_TILES_TOOLTIP")}>
        <Info>
          {l10n("FIELD_UNIQUE")}={spriteSheet.numTiles}
        </Info>
      </TooltipWrapper>
      <FixedSpacer width={5} />
    </Wrapper>
  );
};

export default MetaspriteEditorPreviewSettings;
