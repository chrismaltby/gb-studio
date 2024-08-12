import React, { FC, RefObject, useCallback, useEffect, useState } from "react";
import {
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import ScriptUsesWorker, {
  ScriptUse,
  ScriptUseResult,
} from "./ScriptUses.worker";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CodeIcon } from "ui/icons/Icons";
import { Button } from "ui/buttons/Button";

const worker = new ScriptUsesWorker();

interface ScriptUsesListProps {
  id: string;
  onClose?: () => void;
}

const UsesWrapper = styled.div`
  position: absolute;
  top: 38px;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
`;

const UseMessage = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

export const ScriptUsesList: FC<ScriptUsesListProps> = ({ id, onClose }) => {
  const [fetching, setFetching] = useState(true);
  const { ref, height } = useDimensions();
  const [scriptUses, setScriptUses] = useState<ScriptUse[]>([]);
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state)
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state)
  );
  const customEventsLookup = useAppSelector((state) =>
    customEventSelectors.selectEntities(state)
  );

  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefs(state)
  );

  const dispatch = useAppDispatch();

  const onWorkerComplete = useCallback(
    (e: MessageEvent<ScriptUseResult>) => {
      if (e.data.id === id) {
        setFetching(false);
        setScriptUses(e.data.uses);
      }
    },
    [id]
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    setFetching(true);
    worker.postMessage({
      id,
      scriptId: id,
      scenes,
      actorsLookup,
      triggersLookup,
      scriptEventsLookup,
      scriptEventDefs,
      customEventsLookup,
      l10NData: getL10NData(),
    });
  }, [
    scenes,
    actorsLookup,
    triggersLookup,
    id,
    scriptEventsLookup,
    scriptEventDefs,
    customEventsLookup,
  ]);

  const setSelectedId = (id: string, item: ScriptUse) => {
    if (item.type === "scene") {
      dispatch(editorActions.selectScene({ sceneId: id }));
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId })
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId })
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "custom") {
      dispatch(editorActions.selectCustomEvent({ customEventId: id }));
    }
  };

  return (
    <UsesWrapper ref={ref as RefObject<HTMLDivElement>}>
      <SplitPaneHeader
        collapsed={false}
        onToggle={onClose}
        buttons={
          <Button variant="transparent" size="small" onClick={onClose}>
            {l10n("MENU_EDIT_CUSTOM_EVENT")}
          </Button>
        }
      >
        {l10n("SIDEBAR_SCRIPT_USES")}
      </SplitPaneHeader>
      {fetching ? (
        <UseMessage>...</UseMessage>
      ) : (
        <>
          {scriptUses.length > 0 ? (
            <FlatList
              items={scriptUses}
              height={height - 30}
              setSelectedId={setSelectedId}
              children={({ item }) => {
                switch (item.type) {
                  case "scene":
                    return <EntityListItem item={item} type={item.type} />;
                  case "custom":
                    return (
                      <EntityListItem
                        item={item}
                        type={item.type}
                        icon={<CodeIcon />}
                      />
                    );
                  default:
                    return (
                      <EntityListItem
                        item={item}
                        type={item.type}
                        nestLevel={1}
                      />
                    );
                }
              }}
            />
          ) : (
            <UseMessage>{l10n("FIELD_SCRIPT_NOT_USED")}</UseMessage>
          )}
        </>
      )}
    </UsesWrapper>
  );
};
