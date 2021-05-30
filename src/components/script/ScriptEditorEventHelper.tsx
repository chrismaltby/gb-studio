import React, { FC, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import { ScriptEvent } from "../../store/features/entities/entitiesTypes";
import { RelativePortal } from "../ui/layout/RelativePortal";
import { DialoguePreview } from "./DialoguePreview";

interface ScriptEditorEventHelperProps {
  event: ScriptEvent;
}

export const ScriptEditorEventHelper: FC<ScriptEditorEventHelperProps> = ({
  event,
}) => {
  const eventId = useSelector((state: RootState) => state.editor.eventId);

  if (!event || eventId !== event.id) {
    return null;
  }

  if (event.command === "EVENT_TEXT") {
    return (
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right">
        {Array.isArray(event.args.text) ? (
          event.args.text.map((text: string) => <DialoguePreview text={text} avatarId={event.args.avatarId} />)
        ) : (
          <DialoguePreview text={event.args.text} avatarId={event.args.avatarId} />
        )}
      </RelativePortal>
    );
  }

  return null;
};
