import React, { useCallback, useMemo } from "react";
import { ArrowIcon, SearchIcon } from "ui/icons/Icons";
import DialogueReviewLine, { DialogueLine } from "./DialogueReviewLine";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import navigationActions from "store/features/navigation/navigationActions";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  actorName,
  sceneName,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import { EVENT_TEXT } from "consts";
import { Button } from "ui/buttons/Button";
import styled, { css } from "styled-components";
import {
  walkNormalizedActorScripts,
  walkNormalizedSceneSpecificScripts,
  walkNormalizedTriggerScripts,
} from "shared/lib/scripts/walk";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface DialogueReviewSceneProps {
  id: string;
  onToggle: () => void;
  open: boolean;
}

const Wrapper = styled.div`
  padding: 0px 40px;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

const SceneHeader = styled.div`
  display: flex;
  align-items: center;

  h2 {
    flex-grow: 1;
    margin: 0px;
    padding: 20px 0;
    margin-left: -20px;
  }

  h2:hover {
    cursor: pointer;
  }

  h2 svg {
    width: 10px;
    height: 10px;
    margin-right: 10px;
  }
`;

const SceneHeaderArrow = styled.div<{ open: boolean }>`
  svg {
    position: relative;
    left: -20px;
    width: 10px;
    height: 10px;
    margin-right: 10px;
  }
  ${(props) =>
    props.open
      ? css`
          svg {
            transform: rotate(90deg);
          }
        `
      : ""}
`;

const SceneLines = styled.div`
  padding-bottom: 20px;
`;

const DialogueReviewScene = ({
  id,
  open,
  onToggle,
}: DialogueReviewSceneProps) => {
  const dispatch = useAppDispatch();
  const scene = useAppSelector((state) => sceneSelectors.selectById(state, id));
  const sceneIndex = useAppSelector((state) =>
    sceneSelectors.selectIds(state).indexOf(id)
  );
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state)
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state)
  );

  const dialogueLines = useMemo(() => {
    const memo: DialogueLine[] = [];
    if (!scene) {
      return memo;
    }
    scene.actors.forEach((actorId, actorIndex) => {
      const actor = actorsLookup[actorId];
      actor &&
        walkNormalizedActorScripts(
          actor,
          scriptEventsLookup,
          undefined,
          (cmd) => {
            if (cmd.command === EVENT_TEXT) {
              memo.push({
                entityName: actorName(actor, actorIndex),
                sceneName: sceneName(scene, sceneIndex),
                line: cmd,
              });
            }
          }
        );
    });
    scene.triggers.forEach((triggerId, triggerIndex) => {
      const trigger = triggersLookup[triggerId];
      trigger &&
        walkNormalizedTriggerScripts(
          trigger,
          scriptEventsLookup,
          undefined,
          (cmd) => {
            if (cmd.command === EVENT_TEXT) {
              memo.push({
                entityName: triggerName(trigger, triggerIndex),
                sceneName: sceneName(scene, sceneIndex),
                line: cmd,
              });
            }
          }
        );
    });
    walkNormalizedSceneSpecificScripts(
      scene,
      scriptEventsLookup,
      undefined,
      (cmd) => {
        if (cmd.command === EVENT_TEXT) {
          memo.push({
            entityName: sceneName(scene, sceneIndex),
            sceneName: sceneName(scene, sceneIndex),
            line: cmd,
          });
        }
      }
    );
    return memo;
  }, [actorsLookup, scene, sceneIndex, scriptEventsLookup, triggersLookup]);

  const onChange = (id: string) => (value: string | string[]) => {
    dispatch(
      entitiesActions.editScriptEventArg({
        scriptEventId: id,
        key: "text",
        value,
      })
    );
  };

  const onSearch = useCallback(() => {
    if (!scene) {
      return;
    }
    dispatch(navigationActions.setSection("world"));
    setTimeout(() => {
      dispatch(editorActions.editSearchTerm(""));
      dispatch(editorActions.editSearchTerm(scene.id));
    }, 1);
  }, [dispatch, scene]);

  if (!scene || dialogueLines.length === 0) {
    return <></>;
  }

  return (
    <Wrapper>
      <SceneHeader>
        <SceneHeaderArrow open={open}>
          <ArrowIcon />
        </SceneHeaderArrow>
        <h2 onClick={onToggle}>{sceneName(scene, sceneIndex)}</h2>
        <Button size="small" onClick={onSearch}>
          <SearchIcon />
        </Button>
      </SceneHeader>

      {open && (
        <SceneLines>
          {dialogueLines.map((dialogueLine) => (
            <DialogueReviewLine
              key={dialogueLine.line.id}
              dialogueLine={dialogueLine}
              onChange={onChange(dialogueLine.line.id)}
            />
          ))}
        </SceneLines>
      )}
    </Wrapper>
  );
};

export default DialogueReviewScene;
