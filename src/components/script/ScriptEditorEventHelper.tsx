import React, { FC } from "react";
import { useAppSelector } from "store/hooks";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import { RelativePortal } from "ui/layout/RelativePortal";
import { DialoguePreview } from "./DialoguePreview";
import { MenuPreview } from "./MenuPreview";
import { ensureBoolean, ensureNumber, ensureString } from "shared/types";
import { argValue } from "components/world/SceneEventHelper";

interface ScriptEditorEventHelperProps {
  event: ScriptEventNormalized;
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
  const eventId = useAppSelector((state) => state.editor.eventId);
  const scriptEventDef = useAppSelector(
    (state) => state.scriptEventDefs.lookup[event?.command ?? ""]
  );

  if (!event || !scriptEventDef || eventId !== event.id) {
    return null;
  }

  const args = event.args || {};

  if (scriptEventDef?.helper?.type === "text") {
    const text = argValue(args[scriptEventDef.helper.text]);
    const avatarId = ensureString(
      argValue(args[scriptEventDef.helper.avatarId]),
      ""
    );
    const showFrame = ensureBoolean(
      argValue(args[scriptEventDef.helper.showFrame]),
      true
    );
    const clearPrevious = ensureBoolean(
      argValue(args[scriptEventDef.helper.clearPrevious]),
      true
    );
    const textX = ensureNumber(
      argValue(args[scriptEventDef.helper.textX]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.textX]?.defaultValue,
      0
    );
    const textY = ensureNumber(
      argValue(args[scriptEventDef.helper.textY]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.textY]?.defaultValue,
      0
    );
    const textHeight = ensureNumber(
      argValue(args[scriptEventDef.helper.textHeight]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.textHeight]
          ?.defaultValue,
      0
    );
    const minHeight = ensureNumber(
      argValue(args[scriptEventDef.helper.minHeight]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.minHeight]
          ?.defaultValue,
      0
    );
    const maxHeight = ensureNumber(
      argValue(args[scriptEventDef.helper.maxHeight]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.maxHeight]
          ?.defaultValue,
      0
    );
    return (
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right">
        {Array.isArray(text) ? (
          text.map((text: string, index) => (
            <DialoguePreview
              key={index}
              text={text}
              avatarId={avatarId}
              showFrame={clearPrevious && showFrame}
              textX={textX}
              textY={textY}
              textHeight={textHeight}
              minHeight={minHeight}
              maxHeight={maxHeight}
            />
          ))
        ) : (
          <DialoguePreview
            text={toString(text)}
            avatarId={avatarId}
            showFrame={clearPrevious && showFrame}
            textX={textX}
            textY={textY}
            textHeight={textHeight}
            minHeight={minHeight}
            maxHeight={maxHeight}
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
