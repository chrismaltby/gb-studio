import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Helmet } from "react-helmet";
import debounce from "lodash/debounce";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
import electronActions from "store/features/electron/electronActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import settingsActions from "store/features/settings/settingsActions";
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
import type { NavigationSection } from "store/features/navigation/navigationState";
import {
  getZoomForSection,
  ZoomSection,
} from "store/features/editor/editorState";
import useWindowFocus from "ui/hooks/use-window-focus";
import useWindowSize from "ui/hooks/use-window-size";
import { useAppDispatch, useAppSelector } from "store/hooks";
import API from "renderer/lib/api";

const sectionAccelerators = {
  world: "CommandOrControl+1",
  sprites: "CommandOrControl+2",
  backgrounds: "CommandOrControl+3",
  music: "CommandOrControl+4",
  sounds: "CommandOrControl+5",
  palettes: "CommandOrControl+6",
  dialogue: "CommandOrControl+7",
  settings: "CommandOrControl+8",
};

const zoomSections = ["world", "sprites", "backgrounds", "ui"];

const AppToolbar: FC = () => {
  const dispatch = useAppDispatch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loaded = useAppSelector((state) => state.document.loaded);
  const modified = useAppSelector((state) => state.document.modified);
  const name = useAppSelector((state) => state.project.present.metadata.name);
  const section = useAppSelector((state) => state.navigation.section);
  const zoom = useAppSelector((state) => getZoomForSection(state, section));
  const initalSearchTerm = useAppSelector((state) => state.editor.searchTerm);
  const buildStatus = useAppSelector((state) => state.console.status);
  const running = buildStatus === "running";
  const cancelling = buildStatus === "cancelled";

  const showZoom = zoomSections.includes(section);
  const showSearch = section === "world";
  const [searchTerm, setSearchTerm] = useState<string>(initalSearchTerm);
  const windowFocus = useWindowFocus();
  const windowSize = useWindowSize();
  const smallZoom = (windowSize.width || 0) < 900;
  const showTitle = API.platform === "darwin" && (windowSize.width || 0) > 800;

  const sectionNames = useMemo(
    () => ({
      world: l10n("NAV_GAME_WORLD"),
      sprites: l10n("NAV_SPRITES"),
      backgrounds: l10n("NAV_IMAGES"),
      music: l10n("NAV_MUSIC"),
      sounds: l10n("NAV_SFX"),
      palettes: l10n("NAV_PALETTES"),
      dialogue: l10n("NAV_DIALOGUE_REVIEW"),
      settings: l10n("NAV_SETTINGS"),
    }),
    []
  );

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
    (section: NavigationSection) => () => {
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
    dispatch(electronActions.openFolder("/"));
  }, [dispatch]);

  const openBuildLog = useCallback(() => {
    dispatch(settingsActions.editSettings({ debuggerEnabled: true }));
    dispatch(navigationActions.setSection("world"));
    dispatch(debuggerActions.setIsLogOpen(true));
  }, [dispatch]);

  // Handle focusing search when pressing "/"
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.key === "Escape" &&
      e.target === searchInputRef.current &&
      searchInputRef.current
    ) {
      searchInputRef.current.blur();
    }
    if (e.target && (e.target as Node).nodeName !== "BODY") {
      return;
    }
    if (e.key === "/" && searchInputRef.current) {
      searchInputRef.current.focus();
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

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
          ref={searchInputRef}
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
        <Button title={l10n("BUILD_CANCELLING")} onClick={openBuildLog}>
          <DotsIcon />
        </Button>
      ) : (
        <Button
          title={l10n("TOOLBAR_RUN")}
          onClick={running ? openBuildLog : onRun}
        >
          {running ? <LoadingIcon /> : <PlayIcon />}
        </Button>
      )}
    </Toolbar>
  );
};

export default AppToolbar;
