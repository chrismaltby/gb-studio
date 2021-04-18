import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../store/configureStore";
import {
  sceneSelectors,
  spriteAnimationSelectors,
} from "../../store/features/entities/entitiesState";
import {
  EyeOpenIcon,
  PlayIcon,
  OnionSkinIcon,
  PrevIcon,
  NextIcon,
  GridIcon,
  PauseIcon,
} from "../ui/icons/Icons";
import FloatingPanel, {
  FloatingPanelDivider,
} from "../ui/panels/FloatingPanel";
import editorActions from "../../store/features/editor/editorActions";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { MenuItem } from "../ui/menu/Menu";
import l10n from "../../lib/helpers/l10n";
import { Button } from "../ui/buttons/Button";
import { SceneSelect } from "../forms/SceneSelect";
import { SelectMenu, selectMenuStyleProps } from "../ui/form/Select";
import { RelativePortal } from "../ui/layout/RelativePortal";

const Wrapper = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 11;
`;

const Pill = styled.button`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;

  :active {
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

const MetaspriteEditorPreviewSettings = () => {
  const dispatch = useDispatch();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);
  const value = useSelector(
    (state: RootState) => state.editor.previewAsSceneId
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, value)
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
              optionalLabel="Default Colors"
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
        ▲ {scene ? `Preview as ${scene.name}` : `Preview Using Default Colors`}
      </Pill>
    </Wrapper>
  );
};

export default MetaspriteEditorPreviewSettings;
