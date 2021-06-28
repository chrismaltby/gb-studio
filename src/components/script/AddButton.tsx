import ItemTypes from "lib/dnd/itemTypes";
import l10n from "lib/helpers/l10n";
import React, { useCallback, useRef, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import {
  ScriptEventParentType,
  ScriptEventsRef,
} from "store/features/entities/entitiesTypes";
import styled from "styled-components";
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

interface AddButtonProps {
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
}

const Wrapper = styled.div`
  display: flex;
  padding: 10px;
  background: ${(props) => props.theme.colors.scripting.form.background};

  ${Button} {
    width: 100%;
  }
`;

const AddButton = ({ parentType, parentId, parentKey }: AddButtonProps) => {
  const dispatch = useDispatch();
  const [isOpen, setOpen] = useState(false);
  const [pinDirection, setPinDirection] =
    useState<"bottom-right" | "top-right">("bottom-right");
  const [menuWidth, setMenuWidth] = useState(280);
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
    setMenuWidth(boundingRect.width);
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  drop(dropRef);

  return (
    <ScriptEventWrapper ref={dropRef} data-handler-id={handlerId}>
      {isOverCurrent && <ScriptEventPlaceholder />}
      {isOpen && (
        <>
          <MenuOverlay onClick={onClose} />
          <RelativePortal pin={pinDirection} offsetX={40} offsetY={20}>
            <div style={{ minWidth: menuWidth }}>
              <AddScriptEventMenu
                onBlur={onClose}
                parentId={parentId}
                parentKey={parentKey}
                parentType={parentType}
              />
            </div>
          </RelativePortal>
        </>
      )}
      <Wrapper>
        <Button onClick={onOpen}>{l10n("SIDEBAR_ADD_EVENT")}</Button>
      </Wrapper>
    </ScriptEventWrapper>
  );
};

export default AddButton;
