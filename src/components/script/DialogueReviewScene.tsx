import React, { useCallback, useMemo } from "react";
import { ArrowIcon, SearchIcon } from "ui/icons/Icons";
import DialogueReviewLine, { DialogueLine } from "./DialogueReviewLine";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  scriptEventSelectors,
  actorPrefabSelectors,
  triggerPrefabSelectors,
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
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities
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
      const prefab = actorPrefabsLookup[actor?.prefabId ?? ""];
      actor &&
        walkNormalizedActorScripts(
          actor,
          scriptEventsLookup,
          actorPrefabsLookup,
          undefined,
          (cmd) => {
            if (cmd.command === EVENT_TEXT) {
              memo.push({
                entityName: actorName(actor, actorIndex),
                sceneName: sceneName(scene, sceneIndex),
                line: cmd,
                overrideActorId: prefab ? actor.id : undefined,
              });
            }
          }
        );
    });
    scene.triggers.forEach((triggerId, triggerIndex) => {
      const trigger = triggersLookup[triggerId];
      const prefab = triggerPrefabsLookup[trigger?.prefabId ?? ""];
      trigger &&
        walkNormalizedTriggerScripts(
          trigger,
          scriptEventsLookup,
          triggerPrefabsLookup,
          undefined,
          (cmd) => {
            if (cmd.command === EVENT_TEXT) {
              memo.push({
                entityName: triggerName(trigger, triggerIndex),
                sceneName: sceneName(scene, sceneIndex),
                line: cmd,
                overrideTriggerId: prefab ? trigger.id : undefined,
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
  }, [
    actorPrefabsLookup,
    actorsLookup,
    scene,
    sceneIndex,
    scriptEventsLookup,
    triggerPrefabsLookup,
    triggersLookup,
  ]);

  const onChange =
    (dialogueLine: DialogueLine) => (value: string | string[]) => {
      if (dialogueLine.overrideActorId) {
        dispatch(
          entitiesActions.editActorPrefabScriptEventOverride({
            actorId: dialogueLine.overrideActorId,
            scriptEventId: dialogueLine.line.id,
            args: { text: value },
          })
        );
      } else if (dialogueLine.overrideTriggerId) {
        dispatch(
          entitiesActions.editTriggerPrefabScriptEventOverride({
            triggerId: dialogueLine.overrideTriggerId,
            scriptEventId: dialogueLine.line.id,
            args: { text: value },
          })
        );
      } else {
        dispatch(
          entitiesActions.editScriptEventArg({
            scriptEventId: dialogueLine.line.id,
            key: "text",
            value,
          })
        );
      }
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
              onChange={onChange(dialogueLine)}
            />
          ))}
        </SceneLines>
      )}
    </Wrapper>
  );
};

export default DialogueReviewScene;
