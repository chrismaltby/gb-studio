import React, { useCallback } from "react";
import { customEventSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { customEventName } from "shared/lib/entities/entitiesHelpers";
import { LinkButton } from "ui/debugger/LinkButton";

interface DebuggerCustomEventLinkProps {
  id: string;
}

const DebuggerCustomEventLink = ({ id }: DebuggerCustomEventLinkProps) => {
  const dispatch = useAppDispatch();
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, id),
  );
  const customEventIndex = useAppSelector((state) =>
    customEventSelectors.selectIds(state).indexOf(id),
  );

  const onSelect = useCallback(() => {
    dispatch(editorActions.selectCustomEvent({ customEventId: id }));
  }, [dispatch, id]);

  if (!customEvent) {
    return null;
  }

  return (
    <LinkButton onClick={onSelect}>
      {customEventName(customEvent, customEventIndex)}
    </LinkButton>
  );
};

export default DebuggerCustomEventLink;
