import React, { FC, useEffect, useState } from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import type { ScriptUse } from "renderer/lib/workers/ScriptUses.worker";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CodeIcon } from "ui/icons/Icons";
import { Button } from "ui/buttons/Button";
import { findScriptUses } from "renderer/lib/workers/scriptUses";
import { isWorkerRequestAbortError } from "renderer/lib/workers/createWorkerClient";

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
  const { observe, height } = useDimensions();
  const [scriptUses, setScriptUses] = useState<ScriptUse[]>([]);
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state),
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state),
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state),
  );
  const customEventsLookup = useAppSelector((state) =>
    customEventSelectors.selectEntities(state),
  );
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities,
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities,
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    const abortController = new AbortController();
    const loadUses = async () => {
      setFetching(true);
      try {
        const uses = await findScriptUses(
          {
            scriptId: id,
            scenes,
            actorsLookup,
            triggersLookup,
            actorPrefabsLookup,
            triggerPrefabsLookup,
            scriptEventsLookup,
            customEventsLookup,
            l10NData: getL10NData(),
          },
          { signal: abortController.signal },
        );
        setScriptUses(uses);
        setFetching(false);
      } catch (error) {
        if (!isWorkerRequestAbortError(error)) {
          console.error(error);
          setFetching(false);
        }
      }
    };
    void loadUses();
    return () => abortController.abort();
  }, [
    scenes,
    actorsLookup,
    triggersLookup,
    id,
    scriptEventsLookup,
    customEventsLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
  ]);

  const setSelectedId = (id: string, item: ScriptUse) => {
    if (item.type === "scene") {
      dispatch(editorActions.selectScene({ sceneId: id }));
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "custom") {
      dispatch(editorActions.selectCustomEvent({ customEventId: id }));
    }
  };

  return (
    <UsesWrapper ref={observe}>
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
