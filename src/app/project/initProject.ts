import { ActionCreators } from "redux-undo";
import debounce from "lodash/debounce";
import store from "store/configureStore";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import projectActions from "store/features/project/projectActions";
import buildGameActions from "store/features/buildGame/buildGameActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import engineActions from "store/features/engine/engineActions";
import scriptEventDefsActions from "store/features/scriptEventDefs/scriptEventDefsActions";
import errorActions from "store/features/error/errorActions";
import consoleActions from "store/features/console/consoleActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import { clampSidebarWidth } from "renderer/lib/window/sidebar";
import { initKeyBindings } from "renderer/lib/keybindings/keyBindings";
import { TRACKER_REDO, TRACKER_UNDO } from "consts";
import API from "renderer/lib/api";
import { NavigationSection } from "store/features/navigation/navigationState";
import { Background } from "shared/lib/entities/entitiesTypes";
import { isZoomSection } from "store/features/editor/editorHelpers";

const urlParams = new URLSearchParams(window.location.search);
const projectPath = urlParams.get("path");

if (projectPath) {
  store.dispatch(projectActions.openProject(projectPath));
  initKeyBindings();
}

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
    API.project.setModified();
  } else if (modified && !state.document.modified) {
    API.project.setUnmodified();
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

API.events.watch.sprite.changed.subscribe((_, _filename, data) => {
  store.dispatch(entitiesActions.loadSprite({ data }));
});

API.events.watch.sprite.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeSprite({ filename, plugin }));
});

// Watch Backgrounds

API.events.watch.background.changed.subscribe((_, _filename, data) => {
  store.dispatch(
    entitiesActions.loadBackground({ data: data as unknown as Background })
  );
});

API.events.watch.background.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeBackground({ filename, plugin }));
});

// Watch Music

API.events.watch.music.changed.subscribe((_, _filename, data) => {
  store.dispatch(entitiesActions.loadMusic({ data }));
});

API.events.watch.music.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeMusic({ filename, plugin }));
});

// Watch Sounds

API.events.watch.sound.changed.subscribe((_, _filename, data) => {
  store.dispatch(entitiesActions.loadSound({ data }));
});

API.events.watch.sound.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeSound({ filename, plugin }));
});

// Watch Fonts

API.events.watch.font.changed.subscribe((_, _filename, data) => {
  store.dispatch(entitiesActions.loadFont({ data }));
});

API.events.watch.font.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeFont({ filename, plugin }));
});

// Watch Avatars

API.events.watch.avatar.changed.subscribe((_, _filename, data) => {
  store.dispatch(entitiesActions.loadAvatar({ data }));
});

API.events.watch.avatar.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeAvatar({ filename, plugin }));
});

// Watch Emotes

API.events.watch.emote.changed.subscribe((_, _filename, data) => {
  store.dispatch(entitiesActions.loadEmote({ data }));
});

API.events.watch.emote.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeEmote({ filename, plugin }));
});

// Watch Tilesets

API.events.watch.tileset.changed.subscribe((_, _filename, data) => {
  store.dispatch(entitiesActions.loadTileset({ data }));
});

API.events.watch.tileset.removed.subscribe((_, filename, plugin) => {
  store.dispatch(entitiesActions.removeTileset({ filename, plugin }));
});

// Watch UI

API.events.watch.ui.changed.subscribe(() => {
  store.dispatch(projectActions.loadUI());
});

API.events.watch.ui.removed.subscribe(() => {
  store.dispatch(projectActions.loadUI());
});

// Watch Engine Fields

API.events.watch.engineSchema.changed.subscribe((_, fields) => {
  store.dispatch(engineActions.setEngineFields(fields));
});

// Script Event Defs

API.events.watch.scriptEventDefs.changed.subscribe((_, scriptEventDefs) => {
  store.dispatch(scriptEventDefsActions.setScriptEventDefs(scriptEventDefs));
});

// Menu

API.events.menu.saveProject.subscribe(() => {
  store.dispatch(projectActions.saveProject());
});

API.events.menu.onSaveAndCloseProject.subscribe(async () => {
  await store.dispatch(projectActions.saveProject());
  window.close();
});

API.events.menu.undo.subscribe(() => onUndo());

API.events.menu.redo.subscribe(() => onRedo());

API.events.menu.setSection.subscribe(async (_, section: NavigationSection) => {
  store.dispatch(navigationActions.setSection(section));
});

API.events.menu.reloadAssets.subscribe(() => {
  store.dispatch(projectActions.reloadAssets());
});

API.events.menu.zoom.subscribe((_, zoomType) => {
  const state = store.getState();
  const navSection = state.navigation.section;
  if (isZoomSection(navSection)) {
    if (zoomType === "in") {
      store.dispatch(editorActions.zoomIn({ section: navSection }));
    } else if (zoomType === "out") {
      store.dispatch(editorActions.zoomOut({ section: navSection }));
    } else {
      store.dispatch(editorActions.zoomReset({ section: navSection }));
    }
  }
});

API.events.menu.run.subscribe((_, debugEnabled) => {
  store.dispatch(
    buildGameActions.buildGame({
      buildType: "web",
      exportBuild: false,
      debugEnabled,
    })
  );
});

API.events.menu.build.subscribe((_, buildType) => {
  store.dispatch(
    buildGameActions.buildGame({
      buildType,
      exportBuild: true,
    })
  );
});

API.events.menu.ejectEngine.subscribe(() => {
  store.dispatch(buildGameActions.ejectEngine());
});

API.events.menu.exportProject.subscribe((_, exportType) => {
  store.dispatch(buildGameActions.exportProject(exportType));
});

API.events.menu.pasteInPlace.subscribe(() => {
  store.dispatch(clipboardActions.pasteClipboardEntityInPlace());
});

// Settings changed

API.events.settings.uiScaleChanged.subscribe((_, zoomLevel) => {
  API.app.setZoomLevel(zoomLevel);
});

API.settings.app.getUIScale().then((zoomLevel) => {
  API.app.setZoomLevel(zoomLevel);
});

API.events.settings.trackerKeyBindingsChanged.subscribe(() => {
  initKeyBindings();
});

API.events.settings.settingChanged.subscribe((_, key, value) => {
  store.dispatch(
    settingsActions.editSettings({
      [key]: value,
    })
  );
});

// Debugger

API.events.debugger.data.subscribe((_, packet) => {
  switch (packet.action) {
    case "initialized": {
      break;
    }
    case "update-globals": {
      store.dispatch(
        debuggerActions.setRAMData({
          vramPreview: packet.vram,
          variablesData: packet.data,
          scriptContexts: packet.scriptContexts,
          currentSceneSymbol: packet.currentSceneSymbol,
          isPaused: packet.isPaused,
        })
      );
      break;
    }
  }
});

API.events.debugger.symbols.subscribe(
  (_, { variableMap, sceneMap, gbvmScripts }) => {
    store.dispatch(
      debuggerActions.setSymbols({
        variableDataBySymbol: variableMap,
        sceneMap,
        gbvmScripts,
      })
    );
    if (!store.getState().project.present.settings.debuggerEnabled) {
      store.dispatch(
        settingsActions.editSettings({
          debuggerEnabled: true,
        })
      );
    }
  }
);

API.events.debugger.disconnected.subscribe(() => {
  store.dispatch(debuggerActions.disconnect());
});
