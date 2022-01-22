import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import l10n from "lib/helpers/l10n";
import { zoomForSection } from "lib/helpers/gbstudio";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
import electronActions from "store/features/electron/electronActions";
import buildGameActions, {
  BuildType,
} from "store/features/buildGame/buildGameActions";
import { Toolbar, ToolbarText } from "ui/toolbar/Toolbar";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuAccelerator, MenuItem } from "ui/menu/Menu";
import { ZoomButton } from "ui/buttons/ZoomButton";
import { FixedSpacer, FlexGrow } from "ui/spacing/Spacing";
import { SearchInput } from "ui/form/SearchInput";
import { Button } from "ui/buttons/Button";
import {
  DotsIcon,
  ExportIcon,
  FolderIcon,
  LoadingIcon,
  PlayIcon,
} from "ui/icons/Icons";
import { RootState } from "store/configureStore";
import { NavigationSection } from "store/features/navigation/navigationState";
import { ZoomSection } from "store/features/editor/editorState";
import useWindowFocus from "ui/hooks/use-window-focus";
import useWindowSize from "ui/hooks/use-window-size";
import initElectronL10n from "lib/helpers/initElectronL10n";

// Make sure localisation has loaded so that
// l10n function can be used at top level
initElectronL10n();

const sectionNames = {
  world: l10n("NAV_GAME_WORLD"),
  sprites: l10n("NAV_SPRITES"),
  backgrounds: l10n("NAV_BACKGROUNDS"),
  music: l10n("NAV_MUSIC"),
  palettes: l10n("NAV_PALETTES"),
  dialogue: l10n("NAV_DIALOGUE_REVIEW"),
  build: l10n("NAV_BUILD_AND_RUN"),
  settings: l10n("NAV_SETTINGS"),
};

type SectionKey = keyof typeof sectionNames;

const sectionAccelerators = {
  world: "CommandOrControl+1",
  sprites: "CommandOrControl+2",
  backgrounds: "CommandOrControl+3",
  music: "CommandOrControl+4",
  palettes: "CommandOrControl+5",
  dialogue: "CommandOrControl+6",
  build: "CommandOrControl+7",
  settings: "CommandOrControl+8",
};

const zoomSections = ["world", "sprites", "backgrounds", "ui"];

const AppToolbar: FC = () => {
  const dispatch = useDispatch();
  const loaded = useSelector((state: RootState) => state.document.loaded);
  const modified = useSelector((state: RootState) => state.document.modified);
  const name = useSelector(
    (state: RootState) => state.project.present.metadata.name
  );
  const section = useSelector((state: RootState) => state.navigation.section);
  const zoom = useSelector((state: RootState) =>
    zoomForSection(section, state.editor)
  );
  const initalSearchTerm = useSelector(
    (state: RootState) => state.editor.searchTerm
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const buildStatus = useSelector((state: RootState) => state.console.status);
  const running = buildStatus === "running";
  const cancelling = buildStatus === "cancelled";

  const showZoom = zoomSections.includes(section);
  const showSearch = section === "world";
  const [searchTerm, setSearchTerm] = useState<string>(initalSearchTerm);
  const windowFocus = useWindowFocus();
  const windowSize = useWindowSize();
  const smallZoom = (windowSize.width || 0) < 900;
  const showTitle =
    process.platform === "darwin" && (windowSize.width || 0) > 800;

  const onRun = useCallback(() => {
    dispatch(buildGameActions.buildGame({ buildType: "web" }));
  }, [dispatch]);

  const onBuild = useCallback(
    (buildType: BuildType) => () => {
      dispatch(buildGameActions.buildGame({ buildType, exportBuild: true }));
    },
    [dispatch]
  );

  const setSection = useCallback(
    (section: SectionKey) => () => {
      dispatch(navigationActions.setSection(section));
    },
    [dispatch]
  );

  const onZoomIn = useCallback(() => {
    if (showZoom) {
      dispatch(editorActions.zoomIn({ section: section as ZoomSection }));
    }
  }, [dispatch, section, showZoom]);

  const onZoomOut = useCallback(() => {
    if (showZoom) {
      dispatch(editorActions.zoomOut({ section: section as ZoomSection }));
    }
  }, [dispatch, section, showZoom]);

  const onZoomReset = useCallback(() => {
    if (showZoom) {
      dispatch(editorActions.zoomReset({ section: section as ZoomSection }));
    }
  }, [dispatch, section, showZoom]);

  const onChangeSearchTermDebounced = useMemo(
    () =>
      debounce((searchTerm: string) => {
        dispatch(editorActions.editSearchTerm(searchTerm));
      }, 300),
    [dispatch]
  );

  const onChangeSearchTerm = useCallback(
    (e) => {
      setSearchTerm(e.currentTarget.value);
      onChangeSearchTermDebounced(e.currentTarget.value);
    },
    [onChangeSearchTermDebounced]
  );

  useEffect(() => {
    if (!initalSearchTerm) {
      setSearchTerm("");
    }
  }, [initalSearchTerm]);

  const openProjectFolder = useCallback(() => {
    dispatch(electronActions.openFolder(projectRoot));
  }, [dispatch, projectRoot]);

  if (!loaded) {
    return <Toolbar />;
  }

  return (
    <Toolbar focus={windowFocus}>
      <Helmet>
        <title>{`GB Studio - ${name || "Untitled"}${
          modified ? ` (${l10n("TOOLBAR_MODIFIED")})` : ""
        }`}</title>
      </Helmet>
      <DropdownButton
        label={
          <span style={{ textAlign: "left", minWidth: 106 }}>
            {sectionNames[section]}
          </span>
        }
      >
        {Object.keys(sectionNames).map((key: string) => (
          <MenuItem
            key={key}
            onClick={setSection(key as NavigationSection)}
            style={{ minWidth: 150 }}
          >
            {sectionNames[key as NavigationSection]}
            {sectionAccelerators[key as NavigationSection] && (
              <MenuAccelerator
                accelerator={sectionAccelerators[key as NavigationSection]}
              />
            )}
          </MenuItem>
        ))}
      </DropdownButton>
      {showZoom && (
        <ZoomButton
          zoom={Math.round(zoom)}
          size={smallZoom ? "small" : "medium"}
          title={l10n("TOOLBAR_ZOOM_RESET")}
          titleIn={l10n("TOOLBAR_ZOOM_IN")}
          titleOut={l10n("TOOLBAR_ZOOM_OUT")}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
        />
      )}
      <FlexGrow />
      {showTitle && (
        <ToolbarText>
          {name || "Untitled"} {modified && ` (${l10n("TOOLBAR_MODIFIED")})`}
        </ToolbarText>
      )}
      <FlexGrow />
      {showSearch && (
        <SearchInput
          placeholder={l10n("TOOLBAR_SEARCH")}
          value={searchTerm || ""}
          onChange={onChangeSearchTerm}
          onSubmit={onChangeSearchTerm}
        />
      )}
      <Button
        title={l10n("TOOLBAR_OPEN_PROJECT_FOLDER")}
        onClick={openProjectFolder}
      >
        <FolderIcon />
      </Button>
      <DropdownButton
        title={l10n("TOOLBAR_EXPORT_AS")}
        label={<ExportIcon />}
        showArrow={false}
        menuDirection="right"
      >
        <MenuItem onClick={onBuild("rom")}>
          {l10n("TOOLBAR_EXPORT_ROM")}{" "}
          <MenuAccelerator accelerator="CommandOrControl+Shift+B" />
        </MenuItem>
        <MenuItem onClick={onBuild("web")}>
          {l10n("TOOLBAR_EXPORT_WEB")}{" "}
          <MenuAccelerator accelerator="CommandOrControl+Shift+N" />
        </MenuItem>
        <MenuItem onClick={onBuild("pocket")}>
          {l10n("TOOLBAR_EXPORT_POCKET")}
          <MenuAccelerator accelerator="CommandOrControl+Shift+M" />
        </MenuItem>
      </DropdownButton>
      <FixedSpacer width={10} />
      {cancelling ? (
        <Button title={l10n("BUILD_CANCELLING")} onClick={setSection("build")}>
          <DotsIcon />
        </Button>
      ) : (
        <Button
          title={l10n("TOOLBAR_RUN")}
          onClick={running ? setSection("build") : onRun}
        >
          {running ? <LoadingIcon /> : <PlayIcon />}
        </Button>
      )}
    </Toolbar>
  );
};

export default AppToolbar;
