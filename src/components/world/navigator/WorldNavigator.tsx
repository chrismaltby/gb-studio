import React from "react";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import useSplitPane from "ui/hooks/use-split-pane";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SceneNavigatorPane } from "./SceneNavigatorPane";
import { CustomEventNavigatorPane } from "./CustomEventNavigatorPane";
import { Button } from "ui/buttons/Button";
import {
  BackgroundIcon,
  JigsawIcon,
  NoteIcon,
  PlusIcon,
  SearchIcon,
} from "ui/icons/Icons";
import { VariableNavigatorPane } from "./VariableNavigatorPane";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListSearch } from "ui/lists/EntityListItem";
import { FixedSpacer } from "ui/spacing/Spacing";
import { PrefabNavigatorPane } from "./PrefabNavigatorPane";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { ConstantNavigatorPane } from "./ConstantNavigatorPane";
import { defaultProjectSettings } from "consts";
import { useNavigatorSearch } from "store/features/editor/hooks/useNavigatorSearch";

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

export const WorldNavigator = () => {
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

  const onAddScene =
    (sceneType: "image" | "tilemap") => (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(editorActions.setSceneAddType(sceneType));
      dispatch(editorActions.setTool({ tool: "scene" }));
    };

  const onAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(editorActions.setTool({ tool: "note" }));
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

  const {
    searchEnabled: scenesSearchEnabled,
    searchTerm: scenesSearchTerm,
    setSearchTerm: setScenesSearchTerm,
    toggleSearchEnabled: toggleScenesSearchEnabled,
  } = useNavigatorSearch("scenes");
  const showScenesSearch = scenesSearchEnabled && splitSizes[SCENES_PANE] > 60;

  const {
    searchEnabled: scriptsSearchEnabled,
    searchTerm: scriptsSearchTerm,
    setSearchTerm: setScriptsSearchTerm,
    toggleSearchEnabled: toggleScriptsSearchEnabled,
  } = useNavigatorSearch("customEvents");
  const showScriptsSearch =
    scriptsSearchEnabled && splitSizes[SCRIPTS_PANE] > 60;

  const {
    searchEnabled: prefabsSearchEnabled,
    searchTerm: prefabsSearchTerm,
    setSearchTerm: setPrefabsSearchTerm,
    toggleSearchEnabled: togglePrefabsSearchEnabled,
  } = useNavigatorSearch("prefabs");
  const showPrefabsSearch =
    prefabsSearchEnabled && splitSizes[PREFABS_PANE] > 60;

  const {
    searchEnabled: variablesSearchEnabled,
    searchTerm: variablesSearchTerm,
    setSearchTerm: setVariablesSearchTerm,
    toggleSearchEnabled: toggleVariablesSearchEnabled,
  } = useNavigatorSearch("variables");
  const showVariablesSearch =
    variablesSearchEnabled && splitSizes[VARIABLES_PANE] > 60;

  const {
    searchEnabled: constantsSearchEnabled,
    searchTerm: constantsSearchTerm,
    setSearchTerm: setConstantsSearchTerm,
    toggleSearchEnabled: toggleConstantsSearchEnabled,
  } = useNavigatorSearch("constants");
  const showConstantsSearch =
    constantsSearchEnabled && splitSizes[CONSTANTS_PANE] > 60;

  return (
    <Wrapper>
      <Pane style={{ height: splitSizes[SCENES_PANE] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(SCENES_PANE)}
          collapsed={Math.floor(splitSizes[SCENES_PANE]) <= COLLAPSED_SIZE}
          buttons={
            <>
              <DropdownButton
                variant="transparent"
                size="small"
                title={l10n("TOOL_ADD_SCENE_LABEL")}
                label={<PlusIcon />}
                showArrow={false}
              >
                <MenuItem
                  onClick={onAddScene("image")}
                  icon={<BackgroundIcon />}
                >
                  {l10n("FIELD_IMAGE_SCENE")}
                </MenuItem>
                <MenuItem onClick={onAddScene("tilemap")} icon={<JigsawIcon />}>
                  {l10n("FIELD_TILEMAP_SCENE")}
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={onAddNote} icon={<NoteIcon />}>
                  {l10n("NOTE")}
                </MenuItem>
              </DropdownButton>
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
        <SceneNavigatorPane
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
        <PrefabNavigatorPane
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
        <CustomEventNavigatorPane
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
        <ConstantNavigatorPane
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
        <VariableNavigatorPane
          height={splitSizes[VARIABLES_PANE] - (showVariablesSearch ? 60 : 30)}
          searchTerm={variablesSearchTerm}
        />
      </Pane>
    </Wrapper>
  );
};
