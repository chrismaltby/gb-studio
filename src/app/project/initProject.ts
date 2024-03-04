import Path from "path";
import { ActionCreators } from "redux-undo";
import { IpcRendererEvent, ipcRenderer, webFrame } from "electron";
import debounce from "lodash/debounce";
import mapValues from "lodash/mapValues";
import store from "store/configureStore";
import plugins, { initPlugins } from "lib/plugins/plugins";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import projectActions from "store/features/project/projectActions";
import buildGameActions, {
  BuildType,
  ProjectExportType,
} from "store/features/buildGame/buildGameActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import engineActions from "store/features/engine/engineActions";
import errorActions from "store/features/error/errorActions";
import consoleActions from "store/features/console/consoleActions";
import { clampSidebarWidth } from "renderer/lib/window/sidebar";
import { initKeyBindings } from "renderer/lib/keybindings/keyBindings";
import { TRACKER_REDO, TRACKER_UNDO } from "consts";
import {
  initEngineFields,
  engineFieldsEmitter,
} from "lib/project/engineFields";
import API from "renderer/lib/api";
import { ZoomSection } from "store/features/editor/editorState";
import { NavigationSection } from "store/features/navigation/navigationState";
import { SettingsState } from "store/features/settings/settingsState";
import { Background } from "shared/lib/entities/entitiesTypes";

const actions = {
  ...editorActions,
  ...entitiesActions,
  ...settingsActions,
  ...navigationActions,
  ...buildGameActions,
  ...clipboardActions,
};

const vmActions = mapValues(actions, (_fn: any, key: any) => {
  // Strip proxy object from VM2 output
  return (payload: any) =>
    ((actions as any)[key] as any)(JSON.parse(JSON.stringify(payload)));
});

const urlParams = new URLSearchParams(window.location.search);
const projectPath = urlParams.get("path");

if (projectPath) {
  const projectRoot = Path.dirname(projectPath);
  store.dispatch(projectActions.openProject(projectPath));

  initPlugins(projectRoot);
  initEngineFields(projectRoot);
  initKeyBindings();

  engineFieldsEmitter.on("sync", (res) => {
    store.dispatch(engineActions.setEngineFields(res.fields));
  });
}

(window as any).ActionCreators = ActionCreators;
(window as any).store = store;
(window as any).undo = () => {
  store.dispatch(ActionCreators.undo());
};

window.addEventListener("error", (error) => {
  if (error.message.indexOf("dead code elimination") > -1) {
    return true;
  }
  error.stopPropagation();
  error.preventDefault();
  // eslint-disable-next-line no-console
  console.error(error);
  store.dispatch(
    errorActions.setGlobalError({
      message: error.message,
      filename: error.filename,
      line: error.lineno,
      col: error.colno,
      stackTrace: error.error.stack,
    })
  );
  return false;
});

const onSaveProject = () => {
  store.dispatch(projectActions.saveProject());
};

const onSaveAndCloseProject = async () => {
  await store.dispatch(projectActions.saveProject());
  window.close();
};

const onSaveProjectAs = (_: IpcRendererEvent, pathName: string) => {
  store.dispatch(projectActions.saveProject(pathName));
};

const onUndo = () => {
  if (store.getState().trackerDocument.past.length > 0) {
    store.dispatch({ type: TRACKER_UNDO });
  } else {
    store.dispatch(ActionCreators.undo());
  }
};

const onRedo = () => {
  if (store.getState().trackerDocument.future.length > 0) {
    store.dispatch({ type: TRACKER_REDO });
  } else {
    store.dispatch(ActionCreators.redo());
  }
};

const onSetSection = (_: IpcRendererEvent, section: NavigationSection) => {
  store.dispatch(navigationActions.setSection(section));
};

const onReloadAssets = () => {
  store.dispatch(projectActions.reloadAssets());
};

const onUpdateSetting = <K extends keyof SettingsState>(
  _: IpcRendererEvent,
  setting: K,
  value: SettingsState[K]
) => {
  store.dispatch(
    settingsActions.editSettings({
      [setting]: value,
    })
  );
};

const onZoom = (_: IpcRendererEvent, zoomType: string) => {
  const state = store.getState();
  if (zoomType === "in") {
    store.dispatch(
      editorActions.zoomIn({ section: state.navigation.section as ZoomSection })
    );
  } else if (zoomType === "out") {
    store.dispatch(
      editorActions.zoomOut({
        section: state.navigation.section as ZoomSection,
      })
    );
  } else {
    store.dispatch(
      editorActions.zoomReset({
        section: state.navigation.section as ZoomSection,
      })
    );
  }
};

const onWindowZoom = (_: IpcRendererEvent, zoomLevel: number) => {
  webFrame.setZoomLevel(zoomLevel);
};
API.settings.app.getUIScale().then((zoomLevel) => {
  webFrame.setZoomLevel(zoomLevel);
});

const onRun = () => {
  store.dispatch(buildGameActions.buildGame());
};

const onBuild = (_: IpcRendererEvent, buildType: BuildType, eject: boolean) => {
  store.dispatch(
    buildGameActions.buildGame({
      buildType,
      exportBuild: !eject,
    })
  );
};

const onEjectEngine = () => {
  store.dispatch(buildGameActions.ejectEngine());
};

const onExportProject = (
  _: IpcRendererEvent,
  exportType: ProjectExportType
) => {
  store.dispatch(buildGameActions.exportProject(exportType));
};

const onPluginRun = (_: IpcRendererEvent, pluginId: string) => {
  if ((plugins.menu as any)[pluginId] && (plugins.menu as any)[pluginId].run) {
    (plugins.menu as any)[pluginId].run(store, vmActions);
  }
};

const onPasteInPlace = () => {
  store.dispatch(clipboardActions.pasteClipboardEntityInPlace());
};

const onKeyBindingsUpdate = () => {
  initKeyBindings();
};

ipcRenderer.on("save-project", onSaveProject);
ipcRenderer.on("save-project-and-close", onSaveAndCloseProject);
ipcRenderer.on("save-as-project", onSaveProjectAs);
ipcRenderer.on("undo", onUndo);
ipcRenderer.on("redo", onRedo);
ipcRenderer.on("section", onSetSection);
ipcRenderer.on("reloadAssets", onReloadAssets);
ipcRenderer.on("updateSetting", onUpdateSetting);
ipcRenderer.on("zoom", onZoom);
ipcRenderer.on("windowZoom", onWindowZoom);
ipcRenderer.on("run", onRun);
ipcRenderer.on("build", onBuild);
ipcRenderer.on("ejectEngine", onEjectEngine);
ipcRenderer.on("exportProject", onExportProject);
ipcRenderer.on("plugin-run", onPluginRun);
ipcRenderer.on("paste-in-place", onPasteInPlace);
ipcRenderer.on("keybindings-update", onKeyBindingsUpdate);

(async () => {
  const worldSidebarWidth = await API.settings.getNumber(
    "worldSidebarWidth",
    0
  );
  const filesSidebarWidth = await API.settings.getNumber(
    "filesSidebarWidth",
    0
  );
  const navigatorSidebarWidth = await API.settings.getNumber(
    "navigatorSidebarWidth",
    0
  );

  if (worldSidebarWidth) {
    store.dispatch(
      editorActions.resizeWorldSidebar(clampSidebarWidth(worldSidebarWidth))
    );
  }
  if (filesSidebarWidth) {
    store.dispatch(
      editorActions.resizeFilesSidebar(clampSidebarWidth(filesSidebarWidth))
    );
  }
  if (navigatorSidebarWidth) {
    store.dispatch(editorActions.resizeNavigatorSidebar(navigatorSidebarWidth));
  }
})();

window.addEventListener(
  "resize",
  debounce(() => {
    const state = store.getState();
    store.dispatch(
      editorActions.resizeWorldSidebar(
        clampSidebarWidth(state.editor.worldSidebarWidth)
      )
    );
    store.dispatch(
      editorActions.resizeFilesSidebar(
        clampSidebarWidth(state.editor.filesSidebarWidth)
      )
    );
  }, 500)
);

// Overide Accelerator undo for windows, fixes chrome undo conflict
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyZ" && e.ctrlKey) {
    if (e.shiftKey) {
      e.preventDefault();
      onRedo();
    } else {
      e.preventDefault();
      onUndo();
    }
  }
});

// Prevent mousewheel from accidentally changing focused number fields
document.body.addEventListener("mousewheel", () => {
  if (
    document.activeElement &&
    (document.activeElement as HTMLInputElement).type === "number"
  ) {
    (document.activeElement as HTMLInputElement).blur();
  }
});

let modified = true;
store.subscribe(() => {
  const state = store.getState();
  if (!modified && state.document.modified) {
    ipcRenderer.send("document-modified", {});
  } else if (modified && !state.document.modified) {
    ipcRenderer.send("document-unmodified", {});
  }
  modified = state.document.modified;
});

API.project.onBuildLog((_event, message) => {
  store.dispatch(consoleActions.stdOut(message));
});

API.project.onBuildError((_event, message) => {
  store.dispatch(consoleActions.stdErr(message));
});

// Watch Sprites

API.events.watch.sprite.changed.on((_, _filename, data) => {
  store.dispatch(entitiesActions.loadSprite({ data }));
});

API.events.watch.sprite.removed.on((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeSprite({ filename, plugin }));
});

// Watch Backgrounds

API.events.watch.background.changed.on((_, _filename, data) => {
  store.dispatch(
    entitiesActions.loadBackground({ data: data as unknown as Background })
  );
});

API.events.watch.background.removed.on((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeBackground({ filename, plugin }));
});

// Watch Music

API.events.watch.music.changed.on((_, _filename, data) => {
  store.dispatch(entitiesActions.loadMusic({ data }));
});

API.events.watch.music.removed.on((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeMusic({ filename, plugin }));
});

// Watch Sounds

API.events.watch.sound.changed.on((_, _filename, data) => {
  store.dispatch(entitiesActions.loadSound({ data }));
});

API.events.watch.sound.removed.on((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeSound({ filename, plugin }));
});

// Watch Fonts

API.events.watch.font.changed.on((_, _filename, data) => {
  store.dispatch(entitiesActions.loadFont({ data }));
});

API.events.watch.font.removed.on((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeFont({ filename, plugin }));
});

// Watch Avatars

API.events.watch.avatar.changed.on((_, _filename, data) => {
  store.dispatch(entitiesActions.loadAvatar({ data }));
});

API.events.watch.avatar.removed.on((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeAvatar({ filename, plugin }));
});

// Watch Emotes

API.events.watch.emote.changed.on((_, _filename, data) => {
  store.dispatch(entitiesActions.loadEmote({ data }));
});

API.events.watch.emote.removed.on((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeEmote({ filename, plugin }));
});

// Watch UI

API.events.watch.ui.changed.on(() => {
  store.dispatch(projectActions.loadUI());
});

API.events.watch.ui.removed.on(() => {
  store.dispatch(projectActions.loadUI());
});

// Watch Engine Fields

API.events.watch.engineSchema.changed.on((_, fields) => {
  store.dispatch(engineActions.setEngineFields(fields));
});
