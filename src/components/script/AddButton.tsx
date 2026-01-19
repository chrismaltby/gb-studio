import ItemTypes from "renderer/lib/dnd/itemTypes";
import l10n from "shared/lib/lang/l10n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import {
  ScriptEventParentType,
  ScriptEventsRef,
} from "shared/lib/entities/entitiesTypes";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  ScriptEventPlaceholder,
  ScriptEventWrapper,
} from "ui/scripting/ScriptEvents";
import { RelativePortal } from "ui/layout/RelativePortal";
import AddScriptEventMenu from "./AddScriptEventMenu";
import { MenuOverlay } from "ui/menu/Menu";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { CloneIcon, PlusIcon } from "ui/icons/Icons";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { StyledButton } from "ui/buttons/style";
import { acceleratorForPlatform } from "ui/menu/style";
import editorActions from "store/features/editor/editorActions";

interface AddButtonProps {
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  nestLevel?: number;
  conditional?: boolean;
}

interface WrapperProps {
  $conditional?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  container-type: inline-size;
  display: flex;
  padding: 10px;

  background: ${(props) => props.theme.colors.scripting.form.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};

  ${(props) =>
    props.$conditional
      ? css`
          border-top: 0;

          * + * > & {
            border-top: 1px solid
              ${(props) => props.theme.colors.sidebar.border};
          }
        `
      : ""}
`;

const ButtonGroup = styled.div<WrapperProps>`
  display: flex;
  width: 100%;
  max-width: 480px;
  gap: 10px;
  ${StyledButton} {
    flex-grow: 1;
    svg {
      width: 12px;
      height: 12px;
      margin-right: 5px;
    }
  }
  ${StyledButton}:nth-child(2) {
    flex-grow: 0;
    width: 35px;
    svg {
      margin: 0;
    }
  }
`;

const AddButton = ({
  parentType,
  parentId,
  parentKey,
  conditional,
}: AddButtonProps) => {
  const dispatch = useAppDispatch();
  const [isOpen, setOpen] = useState(false);
  const [pinDirection, setPinDirection] = useState<
    "bottom-right" | "top-right"
  >("bottom-right");
  const [pasteMode, setPasteMode] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format,
  );

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const scriptEventSelectionIds = useAppSelector(
    (state) => state.editor.scriptEventSelectionIds,
  );

  const [{ handlerId, isOverCurrent }, drop] = useDrop({
    accept: ItemTypes.SCRIPT_EVENT,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOverCurrent: monitor.isOver({ shallow: true }),
      };
    },
    drop(item: ScriptEventsRef, monitor: DropTargetMonitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }

      if (!dropRef.current) {
        return;
      }

      dispatch(
        entitiesActions.moveScriptEvent({
          to: {
            scriptEventId: "",
            parentType,
            parentKey,
            parentId,
          },
          from: item,
          additionalScriptEventIds: scriptEventSelectionIds,
        }),
      );

      item.parentType = parentType;
      item.parentKey = parentKey;
      item.parentId = parentId;
    },
  });

  const onOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const boundingRect = e.currentTarget.getBoundingClientRect();
    if (boundingRect.top > window.innerHeight * 0.5) {
      setPinDirection("bottom-right");
    } else {
      setPinDirection("top-right");
    }
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onPaste = useCallback(() => {
    dispatch(
      clipboardActions.pasteScriptEvents({
        entityId: parentId,
        type: parentType,
        key: parentKey,
      }),
    );
  }, [dispatch, parentId, parentKey, parentType]);

  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey) {
        setPasteMode(true);
      }
    },
    [setPasteMode],
  );

  const handleKeysUp = useCallback(
    (e: KeyboardEvent) => {
      if (!e.altKey) {
        setPasteMode(false);
      }
    },
    [setPasteMode],
  );

  const handleBlur = useCallback(() => {
    setPasteMode(false);
  }, [setPasteMode]);

  const onMouseEnter = useCallback(() => {
    onFetchClipboard();
    dispatch(
      editorActions.selectScriptEventParent({
        parentType,
        parentId,
        parentKey,
      }),
    );
  }, [dispatch, onFetchClipboard, parentId, parentKey, parentType]);

  const onMouseLeave = useCallback(() => {
    dispatch(editorActions.clearScriptEvent());
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeysUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("keyup", handleKeysUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleKeys, handleKeysUp, handleBlur]);

  drop(dropRef);

  return (
    <ScriptEventWrapper
      ref={dropRef}
      data-handler-id={handlerId}
      style={{
        background: "transparent",
        flexBasis: "100%",
      }}
    >
      {isOverCurrent && <ScriptEventPlaceholder />}
      {isOpen && (
        <>
          <MenuOverlay onClick={onClose} />
          <RelativePortal pin={pinDirection} offsetX={40} offsetY={20}>
            <AddScriptEventMenu
              onBlur={onClose}
              parentId={parentId}
              parentKey={parentKey}
              parentType={parentType}
            />
          </RelativePortal>
        </>
      )}
      <Wrapper
        $conditional={conditional ?? false}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <ButtonGroup>
          {pasteMode ? (
            <Button
              onClick={onPaste}
              title={`${l10n("MENU_PASTE_EVENT")} (${acceleratorForPlatform("CommandOrControl+V")})`}
            >
              <CloneIcon />
              {l10n("MENU_PASTE_EVENT")}
            </Button>
          ) : (
            <>
              <Button onClick={onOpen}>
                <PlusIcon />
                {l10n("SIDEBAR_ADD_EVENT")}
              </Button>
              {clipboardFormat === "gbstudio.scriptevents" && (
                <>
                  <Button
                    onClick={onPaste}
                    title={`${l10n("MENU_PASTE_EVENT")} (${acceleratorForPlatform("CommandOrControl+V")})`}
                  >
                    <CloneIcon />
                  </Button>
                </>
              )}
            </>
          )}
        </ButtonGroup>
      </Wrapper>
    </ScriptEventWrapper>
  );
};

export default AddButton;
