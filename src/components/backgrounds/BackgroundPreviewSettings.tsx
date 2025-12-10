import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import electronActions from "store/features/electron/electronActions";
import { SceneSelect } from "components/forms/SceneSelect";
import { SelectMenu, selectMenuStyleProps } from "ui/form/Select";
import { RelativePortal } from "ui/layout/RelativePortal";
import { FixedSpacer } from "ui/spacing/Spacing";
import l10n from "shared/lib/lang/l10n";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assetPath } from "shared/lib/helpers/assets";
import settingsActions from "store/features/settings/settingsActions";
import { PillButton } from "ui/buttons/PillButton";

interface BackgroundPreviewSettingsProps {
  backgroundId: string;
}

const Wrapper = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 25px;
  left: 10px;
  z-index: 11;
  border-radius: 16px;
  background: ${(props) => props.theme.colors.background};
  box-shadow: 0 0 0 4px ${(props) => props.theme.colors.background};
  font-size: ${(props) => props.theme.typography.fontSize};
`;

const Pill = styled.button`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: ${(props) => props.theme.typography.fontSize};

  &:active {
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

const BackgroundPreviewSettings = ({
  backgroundId,
}: BackgroundPreviewSettingsProps) => {
  const dispatch = useAppDispatch();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, backgroundId),
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);
  const value = useAppSelector((state) => state.editor.previewAsSceneId);
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, value),
  );
  const scenes = useAppSelector((state) => sceneSelectors.selectIds(state));
  const sceneIndex = scenes.indexOf(value);

  const colorsEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono",
  );
  const canPreviewAsMono = useAppSelector(
    (state) => state.project.present.settings.colorMode === "mixed",
  );
  const previewAsMono = useAppSelector(
    (state) => canPreviewAsMono && state.project.present.settings.previewAsMono,
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

  const onEdit = useCallback(() => {
    if (background) {
      dispatch(
        electronActions.openFile({
          filename: assetPath("backgrounds", background),
          type: "image",
        }),
      );
    }
  }, [background, dispatch]);

  const onTogglePreviewAsMono = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        previewAsMono: !previewAsMono,
      }),
    );
  }, [dispatch, previewAsMono]);

  return (
    <Wrapper>
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}
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
      <PillButton
        ref={buttonRef}
        onClick={openMenu}
        onFocus={onButtonFocus}
        onBlur={onButtonBlur}
        variant={scene && !previewAsMono ? "primary" : "normal"}
      >
        ▲{" "}
        {scene
          ? l10n("FIELD_PREVIEW_AS_SCENE", {
              sceneName: sceneName(scene, sceneIndex),
            })
          : l10n("FIELD_PREVIEW_AS_DEFAULT")}
      </PillButton>
      <FixedSpacer width={5} />

      {canPreviewAsMono && (
        <PillButton
          variant={previewAsMono ? "primary" : "normal"}
          onClick={onTogglePreviewAsMono}
        >
          {l10n("FIELD_PREVIEW_AS_MONO")}
        </PillButton>
      )}
      {(colorsEnabled || canPreviewAsMono) && <FixedSpacer width={10} />}

      <Pill ref={buttonRef} onClick={onEdit}>
        {l10n("FIELD_EDIT_IMAGE")}
      </Pill>
    </Wrapper>
  );
};

export default BackgroundPreviewSettings;
