import React from "react";
import { useCallback, useMemo } from "react";
import {
  ParsedResourceTextSegment,
  parseLinkedText,
} from "shared/lib/helpers/resourceLinks";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
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
      const focusScene = (sceneId: string | undefined) => {
        if (!sceneId) return;
        dispatch(navigationActions.setSection("world"));
        setTimeout(() => {
          dispatch(editorActions.editSearchTerm(""));
          dispatch(editorActions.editSearchTerm(sceneId));
        }, 1);
      };

      switch (segment.entityType) {
        case "scene":
          focusScene(segment.entityId);
          dispatch(
            editorActions.selectScene({
              sceneId: segment.entityId,
            }),
          );
          break;
        case "actor":
          focusScene(segment.sceneId);
          dispatch(
            editorActions.selectActor({
              actorId: segment.entityId,
              sceneId: segment.sceneId || "",
            }),
          );
          break;
        case "trigger":
          focusScene(segment.sceneId);
          dispatch(
            editorActions.selectTrigger({
              triggerId: segment.entityId,
              sceneId: segment.sceneId || "",
            }),
          );
          break;
        case "customEvent":
          dispatch(
            editorActions.selectCustomEvent({
              customEventId: segment.entityId,
            }),
          );
          break;
        case "sprite":
          dispatch(navigationActions.setSection("sprites"));
          dispatch(editorActions.setSelectedSpriteSheetId(segment.entityId));
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
