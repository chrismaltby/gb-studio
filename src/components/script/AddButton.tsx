import ItemTypes from "lib/dnd/itemTypes";
import l10n from "lib/helpers/l10n";
import React, { useRef } from "react";
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

  drop(dropRef);

  return (
    <ScriptEventWrapper ref={dropRef} data-handler-id={handlerId}>
      {isOverCurrent && <ScriptEventPlaceholder />}
      <Wrapper>
        <Button>{l10n("SIDEBAR_ADD_EVENT")}</Button>
      </Wrapper>
    </ScriptEventWrapper>
  );
};

export default AddButton;
