import React, { FC, useCallback } from "react";
import { useAppSelector } from "store/hooks";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import { RelativePortal } from "ui/layout/RelativePortal";
import { DialoguePreview } from "./DialoguePreview";
import { MenuPreview } from "./MenuPreview";
import { ensureBoolean, ensureNumber, ensureString } from "shared/types";
import { getArgValue } from "components/world/SceneEventHelper";
import styled from "styled-components";
import { constantSelectors } from "store/features/entities/entitiesState";

interface ScriptEditorEventHelperProps {
  event: ScriptEventNormalized;
}

const toString = (input: unknown): string => {
  return typeof input === "string" ? input : "";
};

const toInt = (input: unknown): number => {
  return typeof input === "number" ? input : 0;
};

const PreviewWrapper = styled.div`
  > * {
    border-radius: 4px;
    box-shadow: 5px 5px 10px 0px rgba(0, 0, 0, 0.5);
  }
`;

export const ScriptEditorEventHelper: FC<ScriptEditorEventHelperProps> = ({
  event,
}) => {
  const eventId = useAppSelector((state) => state.editor.eventId);
  const scriptEventDef = useAppSelector(
    (state) => state.scriptEventDefs.lookup[event?.command ?? ""]
  );

  const constantsLookup = useAppSelector(constantSelectors.selectEntities);

  const argValue = useCallback(
    (arg: unknown): unknown => {
      return getArgValue(arg, constantsLookup);
    },
    [constantsLookup]
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
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right" zIndex={-1}>
        <PreviewWrapper>
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
                scale={1.5}
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
              scale={1.5}
            />
          )}
        </PreviewWrapper>
      </RelativePortal>
    );
  }

  if (scriptEventDef?.helper?.type === "textdraw") {
    const text = ensureString(argValue(args[scriptEventDef.helper.text]), "");
    const location = ensureString(
      argValue(args[scriptEventDef.helper.location]),
      "background"
    );
    const x = ensureNumber(
      argValue(args[scriptEventDef.helper.x]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.x]?.defaultValue,
      0
    );
    const y = ensureNumber(
      argValue(args[scriptEventDef.helper.y]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.y]?.defaultValue,
      0
    );
    return (
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right" zIndex={-1}>
        <PreviewWrapper>
          <DialoguePreview
            text={text}
            textX={location === "overlay" ? x : 0}
            textY={location === "overlay" ? y : 0}
            showFrame={false}
            minHeight={location === "overlay" ? 4 : 0}
            maxHeight={18}
            scale={1.5}
          />
        </PreviewWrapper>
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
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right" zIndex={-1}>
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
      <RelativePortal offsetX={-10} offsetY={10} pin="top-right" zIndex={-1}>
        <MenuPreview items={items} layout="dialogue" />
      </RelativePortal>
    );
  }

  return null;
};
