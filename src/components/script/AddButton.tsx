import ItemTypes from "lib/dnd/itemTypes";
import l10n from "lib/helpers/l10n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import {
  ScriptEventParentType,
  ScriptEventsRef,
} from "store/features/entities/entitiesTypes";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import entitiesActions from "store/features/entities/entitiesActions";
import { useDispatch } from "react-redux";
import {
  ScriptEventPlaceholder,
  ScriptEventWrapper,
} from "ui/scripting/ScriptEvents";
import { RelativePortal } from "ui/layout/RelativePortal";
import AddScriptEventMenu from "./AddScriptEventMenu";
import { MenuOverlay } from "ui/menu/Menu";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { CloneIcon, PlusIcon } from "ui/icons/Icons";

interface AddButtonProps {
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  nestLevel?: number;
  conditional?: boolean;
}

interface WrapperProps {
  conditional?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  display: flex;
  padding: 10px;

  ${Button} {
    width: 100%;
    max-width: 480px;

    svg {
      width: 12px;
      height: 12px;
      margin-right: 5px;
    }
  }

  background: ${(props) => props.theme.colors.scripting.form.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};

  ${(props) =>
    props.conditional
      ? css`
          border-top: 0;

          * + * > & {
            border-top: 1px solid
              ${(props) => props.theme.colors.sidebar.border};
          }
        `
      : ""}
`;

const AddButton = ({
  parentType,
  parentId,
  parentKey,
  nestLevel,
  conditional,
}: AddButtonProps) => {
  const dispatch = useDispatch();
  const [isOpen, setOpen] = useState(false);
  const [pinDirection, setPinDirection] =
    useState<"bottom-right" | "top-right">("bottom-right");
  const [pasteMode, setPasteMode] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

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
        })
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
      })
    );
  }, [dispatch, parentId, parentKey, parentType]);

  const handleKeys = useCallback((e: KeyboardEvent) => {
    if (e.altKey) {
      setPasteMode(true);
    }
  }, []);

  const handleKeysUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) {
      setPasteMode(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeysUp);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("keyup", handleKeysUp);
    };
  });

  drop(dropRef);

  return (
    <ScriptEventWrapper
      ref={dropRef}
      data-handler-id={handlerId}
      conditional={conditional ?? false}
      nestLevel={nestLevel ?? 0}
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
      <Wrapper conditional={conditional ?? false}>
        <Button onClick={pasteMode ? onPaste : onOpen}>
          {pasteMode ? <CloneIcon /> : <PlusIcon />}
          {pasteMode ? l10n("MENU_PASTE_EVENT") : l10n("SIDEBAR_ADD_EVENT")}
        </Button>
      </Wrapper>
    </ScriptEventWrapper>
  );
};

export default AddButton;
