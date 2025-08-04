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
import { NavigatorConstants } from "./NavigatorConstants";
import { defaultProjectSettings } from "consts";

const COLLAPSED_SIZE = 30;
const REOPEN_SIZE = 205;

const SCENES_PANE = 0;
const PREFABS_PANE = 1;
const SCRIPTS_PANE = 2;
const CONSTANTS_PANE = 3;
const VARIABLES_PANE = 4;

const Wrapper = styled.div`
  height: 100%;
`;

const Pane = styled.div`
  overflow: hidden;
`;

export const Navigator = () => {
  const storedSplitSizes = useAppSelector(
    (state) => state.editor.navigatorSplitSizes,
  );
  const dispatch = useAppDispatch();
  const windowSize = useWindowSize();
  const height = windowSize.height ? windowSize.height - 38 - 4 : 0;

  const updateSplitSizes = (newSizes: number[], manuallyEdited: boolean) => {
    dispatch(
      editorActions.setNavigatorSplitSizes({ sizes: newSizes, manuallyEdited }),
    );
  };

  const splitSizes =
    storedSplitSizes.length ===
    defaultProjectSettings.navigatorSplitSizes.length
      ? storedSplitSizes
      : defaultProjectSettings.navigatorSplitSizes;

  const [onDragStart, togglePane] = useSplitPane({
    sizes: splitSizes,
    setSizes: updateSplitSizes,
    minSizes: [
      COLLAPSED_SIZE,
      COLLAPSED_SIZE,
      COLLAPSED_SIZE,
      COLLAPSED_SIZE,
      COLLAPSED_SIZE,
    ],
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
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    dispatch(entitiesActions.addCustomEvent());
    if (Math.floor(splitSizes[SCRIPTS_PANE]) <= COLLAPSED_SIZE) {
      togglePane(SCRIPTS_PANE);
    }
  };

  const onAddActorPrefab = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    dispatch(entitiesActions.addActorPrefab());
    if (Math.floor(splitSizes[PREFABS_PANE]) <= COLLAPSED_SIZE) {
      togglePane(PREFABS_PANE);
    }
  };

  const onAddTriggerPrefab = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    dispatch(entitiesActions.addTriggerPrefab());
    if (Math.floor(splitSizes[PREFABS_PANE]) <= COLLAPSED_SIZE) {
      togglePane(PREFABS_PANE);
    }
  };

  const onAddConstant = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    dispatch(entitiesActions.addConstant());
    if (Math.floor(splitSizes[CONSTANTS_PANE]) <= COLLAPSED_SIZE) {
      togglePane(CONSTANTS_PANE);
    }
  };

  const [scenesSearchTerm, setScenesSearchTerm] = useState("");
  const [scenesSearchEnabled, setScenesSearchEnabled] = useState(false);
  const showScenesSearch = scenesSearchEnabled && splitSizes[SCENES_PANE] > 60;

  const [scriptsSearchTerm, setScriptsSearchTerm] = useState("");
  const [scriptsSearchEnabled, setScriptsSearchEnabled] = useState(false);
  const showScriptsSearch =
    scriptsSearchEnabled && splitSizes[SCRIPTS_PANE] > 60;

  const [prefabsSearchTerm, setPrefabsSearchTerm] = useState("");
  const [prefabsSearchEnabled, setPrefabsSearchEnabled] = useState(false);
  const showPrefabsSearch =
    prefabsSearchEnabled && splitSizes[PREFABS_PANE] > 60;

  const [variablesSearchTerm, setVariablesSearchTerm] = useState("");
  const [variablesSearchEnabled, setVariablesSearchEnabled] = useState(false);
  const showVariablesSearch =
    variablesSearchEnabled && splitSizes[VARIABLES_PANE] > 60;

  const [constantsSearchTerm, setConstantsSearchTerm] = useState("");
  const [constantsSearchEnabled, setConstantsSearchEnabled] = useState(false);
  const showConstantsSearch =
    constantsSearchEnabled && splitSizes[CONSTANTS_PANE] > 60;

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

  const toggleConstantsSearchEnabled = useCallback(() => {
    if (constantsSearchEnabled) {
      setConstantsSearchTerm("");
    }
    setConstantsSearchEnabled(!constantsSearchEnabled);
  }, [constantsSearchEnabled]);

  return (
    <Wrapper>
      <Pane style={{ height: splitSizes[SCENES_PANE] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(SCENES_PANE)}
          collapsed={Math.floor(splitSizes[SCENES_PANE]) <= COLLAPSED_SIZE}
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
          height={splitSizes[SCENES_PANE] - (showScenesSearch ? 60 : 30)}
          searchTerm={scenesSearchTerm}
        />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(SCENES_PANE)} />
      <Pane style={{ height: splitSizes[PREFABS_PANE] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(PREFABS_PANE)}
          collapsed={Math.floor(splitSizes[PREFABS_PANE]) <= COLLAPSED_SIZE}
          buttons={
            <>
              <DropdownButton
                variant="transparent"
                size="small"
                title={l10n("SIDEBAR_ADD_PREFAB")}
                label={<PlusIcon />}
                showArrow={false}
              >
                <MenuItem onClick={onAddActorPrefab}>{l10n("ACTOR")}</MenuItem>
                <MenuItem onClick={onAddTriggerPrefab}>
                  {l10n("TRIGGER")}
                </MenuItem>
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
          height={splitSizes[PREFABS_PANE] - (showPrefabsSearch ? 60 : 30)}
          searchTerm={prefabsSearchTerm}
        />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(PREFABS_PANE)} />
      <Pane style={{ height: splitSizes[SCRIPTS_PANE] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(SCRIPTS_PANE)}
          collapsed={Math.floor(splitSizes[SCRIPTS_PANE]) <= COLLAPSED_SIZE}
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
          height={splitSizes[SCRIPTS_PANE] - (showScriptsSearch ? 60 : 30)}
          searchTerm={scriptsSearchTerm}
        />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(SCRIPTS_PANE)} />

      <Pane style={{ height: splitSizes[CONSTANTS_PANE] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(CONSTANTS_PANE)}
          collapsed={Math.floor(splitSizes[CONSTANTS_PANE]) <= COLLAPSED_SIZE}
          buttons={
            <>
              <Button
                variant="transparent"
                size="small"
                title={l10n("SIDEBAR_ADD_CONSTANT")}
                onClick={onAddConstant}
              >
                <PlusIcon />
              </Button>
              <FixedSpacer width={5} />
              <Button
                variant={constantsSearchEnabled ? "primary" : "transparent"}
                size="small"
                title={l10n("TOOLBAR_SEARCH")}
                onClick={toggleConstantsSearchEnabled}
              >
                <SearchIcon />
              </Button>
            </>
          }
        >
          {l10n("SIDEBAR_CONSTANTS")}
        </SplitPaneHeader>
        {showConstantsSearch && (
          <EntityListSearch
            type="search"
            value={constantsSearchTerm}
            onChange={(e) => setConstantsSearchTerm(e.currentTarget.value)}
            placeholder={l10n("TOOLBAR_SEARCH")}
            autoFocus
          />
        )}
        <NavigatorConstants
          height={splitSizes[CONSTANTS_PANE] - (showConstantsSearch ? 60 : 30)}
          searchTerm={constantsSearchTerm}
        />
      </Pane>

      <SplitPaneVerticalDivider onMouseDown={onDragStart(CONSTANTS_PANE)} />

      <Pane style={{ height: splitSizes[VARIABLES_PANE] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(VARIABLES_PANE)}
          collapsed={Math.floor(splitSizes[VARIABLES_PANE]) <= COLLAPSED_SIZE}
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
          height={splitSizes[VARIABLES_PANE] - (showVariablesSearch ? 60 : 30)}
          searchTerm={variablesSearchTerm}
        />
      </Pane>
    </Wrapper>
  );
};
