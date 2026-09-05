import React, { useCallback, useMemo } from "react";
import {
  ParsedResourceTextSegment,
  parseLinkedText,
} from "shared/lib/helpers/resourceLinks";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch } from "store/hooks";
import styled from "styled-components";

const Link = styled.a`
  cursor: pointer;
  text-decoration: underline;
`;

export const ResourceLinkedText = ({ text }: { text: string }) => {
  const dispatch = useAppDispatch();

  const parsed = useMemo(() => parseLinkedText(text), [text]);

  const handleClick = useCallback(
    (segment: Extract<ParsedResourceTextSegment, { type: "link" }>) => {
      switch (segment.entityType) {
        case "scene":
          dispatch(
            editorActions.openEditorResourceById({
              type: "scene",
              sceneId: segment.entityId,
            }),
          );
          break;
        case "actor":
          dispatch(
            editorActions.openEditorResourceById({
              type: "actor",
              actorId: segment.entityId,
              sceneId: segment.sceneId || "",
            }),
          );
          break;
        case "trigger":
          dispatch(
            editorActions.openEditorResourceById({
              type: "trigger",
              triggerId: segment.entityId,
              sceneId: segment.sceneId || "",
            }),
          );
          break;
        case "customEvent":
          dispatch(
            editorActions.openEditorResourceById({
              type: "customEvent",
              customEventId: segment.entityId,
            }),
          );
          break;
        case "sprite":
          dispatch(
            editorActions.openEditorResourceById({
              type: "sprite",
              spriteId: segment.entityId,
            }),
          );
          break;
      }
    },
    [dispatch],
  );

  return (
    <div>
      {parsed.map((segment, idx) =>
        segment.type === "text" ? (
          <React.Fragment key={idx}>{segment.value}</React.Fragment>
        ) : (
          <Link key={idx} onClick={() => handleClick(segment)}>
            {segment.linkText}
          </Link>
        ),
      )}
    </div>
  );
};
