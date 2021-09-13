import React, { FC } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { ScriptEvent } from "store/features/entities/entitiesTypes";
import { RelativePortal } from "ui/layout/RelativePortal";
import { DialoguePreview } from "./DialoguePreview";
import { MenuPreview } from "./MenuPreview";

interface ScriptEditorEventHelperProps {
  event: ScriptEvent;
}

const toString = (input: unknown): string => {
  return typeof input === "string" ? input : "";
};

const toInt = (input: unknown): number => {
  return typeof input === "number" ? input : 0;
};

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
        {Array.isArray(event.args?.text) ? (
          event.args?.text.map((text: string, index) => (
            <DialoguePreview
              key={index}
              text={text}
              avatarId={toString(event.args?.avatarId)}
            />
          ))
        ) : (
          <DialoguePreview
            text={toString(event.args?.text)}
            avatarId={toString(event.args?.avatarId)}
          />
        )}
      </RelativePortal>
    );
  }

  if (event.command === "EVENT_MENU") {
    const items = [
      toString(event.args?.option1),
      toString(event.args?.option2),
      toString(event.args?.option3),
      toString(event.args?.option4),
      toString(event.args?.option5),
      toString(event.args?.option6),
      toString(event.args?.option7),
      toString(event.args?.option8),
    ].splice(0, toInt(event.args?.items));

    return (
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right">
        <MenuPreview
          items={items}
          layout={event.args?.layout === "dialogue" ? "dialogue" : "menu"}
        />
      </RelativePortal>
    );
  }

  if (event.command === "EVENT_CHOICE") {
    const items = [
      toString(event.args?.trueText),
      toString(event.args?.falseText),
    ];

    return (
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right">
        <MenuPreview items={items} layout="dialogue" />
      </RelativePortal>
    );
  }

  return null;
};
