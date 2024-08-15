import React, { useCallback, useState } from "react";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import useSplitPane from "ui/hooks/use-split-pane";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { NavigatorScenes } from "./NavigatorScenes";
import { NavigatorCustomEvents } from "./NavigatorCustomEvents";
import { Button } from "ui/buttons/Button";
import { PlusIcon, SearchIcon } from "ui/icons/Icons";
import { NavigatorVariables } from "./NavigatorVariables";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListSearch } from "ui/lists/EntityListItem";
import { FixedSpacer } from "ui/spacing/Spacing";
import { NavigatorPrefabs } from "./NavigatorPrefabs";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";

const COLLAPSED_SIZE = 30;
const REOPEN_SIZE = 205;

const Wrapper = styled.div`
  height: 100%;
`;

const Pane = styled.div`
  overflow: hidden;
`;

export const Navigator = () => {
  const splitSizes = useAppSelector(
    (state) => state.editor.navigatorSplitSizes
  );
  const dispatch = useAppDispatch();
  const windowSize = useWindowSize();
  const height = windowSize.height ? windowSize.height - 38 - 2 : 0;

  const updateSplitSizes = (newSizes: number[], manuallyEdited: boolean) => {
    dispatch(
      editorActions.setNavigatorSplitSizes({ sizes: newSizes, manuallyEdited })
    );
  };

  const [onDragStart, togglePane] = useSplitPane({
    sizes: splitSizes,
    setSizes: updateSplitSizes,
    minSizes: [COLLAPSED_SIZE, COLLAPSED_SIZE, COLLAPSED_SIZE, COLLAPSED_SIZE],
    collapsedSize: COLLAPSED_SIZE,
    reopenSize: REOPEN_SIZE,
    maxTotal: height,
    direction: "vertical",
  });

  const onAddScene = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    dispatch(editorActions.setTool({ tool: "scene" }));
  };

  const onAddCustomEvent = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    dispatch(entitiesActions.addCustomEvent());
    if (Math.floor(splitSizes[1]) <= COLLAPSED_SIZE) {
      togglePane(1);
    }
  };

  const [scenesSearchTerm, setScenesSearchTerm] = useState("");
  const [scenesSearchEnabled, setScenesSearchEnabled] = useState(false);
  const showScenesSearch = scenesSearchEnabled && splitSizes[0] > 60;

  const [scriptsSearchTerm, setScriptsSearchTerm] = useState("");
  const [scriptsSearchEnabled, setScriptsSearchEnabled] = useState(false);
  const showScriptsSearch = scriptsSearchEnabled && splitSizes[1] > 60;

  const [prefabsSearchTerm, setPrefabsSearchTerm] = useState("");
  const [prefabsSearchEnabled, setPrefabsSearchEnabled] = useState(false);
  const showPrefabsSearch = prefabsSearchEnabled && splitSizes[1] > 60;

  const [variablesSearchTerm, setVariablesSearchTerm] = useState("");
  const [variablesSearchEnabled, setVariablesSearchEnabled] = useState(false);
  const showVariablesSearch = variablesSearchEnabled && splitSizes[2] > 60;

  const toggleScenesSearchEnabled = useCallback(() => {
    if (scenesSearchEnabled) {
      setScenesSearchTerm("");
    }
    setScenesSearchEnabled(!scenesSearchEnabled);
  }, [scenesSearchEnabled]);

  const togglePrefabsSearchEnabled = useCallback(() => {
    if (prefabsSearchEnabled) {
      setPrefabsSearchTerm("");
    }
    setPrefabsSearchEnabled(!prefabsSearchEnabled);
  }, [prefabsSearchEnabled]);

  const toggleScriptsSearchEnabled = useCallback(() => {
    if (scriptsSearchEnabled) {
      setScriptsSearchTerm("");
    }
    setScriptsSearchEnabled(!scriptsSearchEnabled);
  }, [scriptsSearchEnabled]);

  const toggleVariablesSearchEnabled = useCallback(() => {
    if (variablesSearchEnabled) {
      setVariablesSearchTerm("");
    }
    setVariablesSearchEnabled(!variablesSearchEnabled);
  }, [variablesSearchEnabled]);

  return (
    <Wrapper>
      <Pane style={{ height: splitSizes[0] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(0)}
          collapsed={Math.floor(splitSizes[0]) <= COLLAPSED_SIZE}
          buttons={
            <>
              <Button
                variant="transparent"
                size="small"
                title={l10n("TOOL_ADD_SCENE_LABEL")}
                onClick={onAddScene}
              >
                <PlusIcon />
              </Button>
              <FixedSpacer width={5} />
              <Button
                variant={scenesSearchEnabled ? "primary" : "transparent"}
                size="small"
                title={l10n("TOOLBAR_SEARCH")}
                onClick={toggleScenesSearchEnabled}
              >
                <SearchIcon />
              </Button>
            </>
          }
        >
          {l10n("SIDEBAR_SCENES")}
        </SplitPaneHeader>
        {showScenesSearch && (
          <EntityListSearch
            type="search"
            value={scenesSearchTerm}
            onChange={(e) => setScenesSearchTerm(e.currentTarget.value)}
            placeholder={l10n("TOOLBAR_SEARCH")}
            autoFocus
          />
        )}
        <NavigatorScenes
          height={splitSizes[0] - (showScenesSearch ? 60 : 30)}
          searchTerm={scenesSearchTerm}
        />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(0)} />
      <Pane style={{ height: splitSizes[1] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(1)}
          collapsed={Math.floor(splitSizes[1]) <= COLLAPSED_SIZE}
          buttons={
            <>
              <DropdownButton
                variant="transparent"
                size="small"
                title={l10n("SIDEBAR_ADD_PREFAB")}
                label={<PlusIcon />}
                showArrow={false}
              >
                <MenuItem>{l10n("ACTOR")}</MenuItem>
                <MenuItem>{l10n("TRIGGER")}</MenuItem>
              </DropdownButton>
              <FixedSpacer width={5} />
              <Button
                variant={prefabsSearchEnabled ? "primary" : "transparent"}
                size="small"
                title={l10n("TOOLBAR_SEARCH")}
                onClick={togglePrefabsSearchEnabled}
              >
                <SearchIcon />
              </Button>
            </>
          }
        >
          {l10n("SIDEBAR_PREFABS")}
        </SplitPaneHeader>
        {showPrefabsSearch && (
          <EntityListSearch
            type="search"
            value={prefabsSearchTerm}
            onChange={(e) => setPrefabsSearchTerm(e.currentTarget.value)}
            placeholder={l10n("TOOLBAR_SEARCH")}
            autoFocus
          />
        )}
        <NavigatorPrefabs
          height={splitSizes[1] - (showPrefabsSearch ? 60 : 30)}
          searchTerm={prefabsSearchTerm}
        />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(1)} />
      <Pane style={{ height: splitSizes[2] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(2)}
          collapsed={Math.floor(splitSizes[2]) <= COLLAPSED_SIZE}
          buttons={
            <>
              <Button
                variant="transparent"
                size="small"
                title={l10n("SIDEBAR_CREATE_CUSTOM_EVENT")}
                onClick={onAddCustomEvent}
              >
                <PlusIcon />
              </Button>
              <FixedSpacer width={5} />
              <Button
                variant={scriptsSearchEnabled ? "primary" : "transparent"}
                size="small"
                title={l10n("TOOLBAR_SEARCH")}
                onClick={toggleScriptsSearchEnabled}
              >
                <SearchIcon />
              </Button>
            </>
          }
        >
          {l10n("SIDEBAR_CUSTOM_EVENTS")}
        </SplitPaneHeader>
        {showScriptsSearch && (
          <EntityListSearch
            type="search"
            value={scriptsSearchTerm}
            onChange={(e) => setScriptsSearchTerm(e.currentTarget.value)}
            placeholder={l10n("TOOLBAR_SEARCH")}
            autoFocus
          />
        )}
        <NavigatorCustomEvents
          height={splitSizes[2] - (showScriptsSearch ? 60 : 30)}
          searchTerm={scriptsSearchTerm}
        />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(2)} />
      <Pane style={{ height: splitSizes[3] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(3)}
          collapsed={Math.floor(splitSizes[3]) <= COLLAPSED_SIZE}
          buttons={
            <Button
              variant={variablesSearchEnabled ? "primary" : "transparent"}
              size="small"
              title={l10n("TOOLBAR_SEARCH")}
              onClick={toggleVariablesSearchEnabled}
            >
              <SearchIcon />
            </Button>
          }
        >
          {l10n("SIDEBAR_VARIABLES")}
        </SplitPaneHeader>
        {showVariablesSearch && (
          <EntityListSearch
            type="search"
            value={variablesSearchTerm}
            onChange={(e) => setVariablesSearchTerm(e.currentTarget.value)}
            placeholder={l10n("TOOLBAR_SEARCH")}
            autoFocus
          />
        )}
        <NavigatorVariables
          height={splitSizes[3] - (showVariablesSearch ? 60 : 30)}
          searchTerm={variablesSearchTerm}
        />
      </Pane>
    </Wrapper>
  );
};
