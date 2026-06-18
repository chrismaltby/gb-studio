import type { Action } from "redux";
import type { ThunkAction } from "@reduxjs/toolkit";
import type { StateWithHistory } from "redux-undo";

export interface RootState {
  editor: import("./features/editor/editorState").EditorState;
  console: import("./features/console/consoleState").ConsoleState;
  music: import("./features/music/musicState").MusicState;
  navigation: import("./features/navigation/navigationState").NavigationState;
  document: typeof import("./features/document/documentState").initialState;
  engine: import("./features/engine/engineState").EngineState;
  clipboard: typeof import("./features/clipboard/clipboardState").initialState;
  sprite: typeof import("./features/sprite/spriteState").initialState;
  scriptEventDefs: typeof import("./features/scriptEventDefs/scriptEventDefsState").initialState;
  debug: import("./features/debugger/debuggerState").DebuggerState;
  tracker: import("./features/tracker/trackerState").TrackerState;
  trackerDocument: StateWithHistory<
    typeof import("./features/trackerDocument/trackerDocumentState").initialState
  >;
  project: StateWithHistory<{
    entities: import("shared/lib/entities/entitiesTypes").EntitiesState;
    settings: import("./features/settings/settingsState").SettingsState;
    metadata: import("./features/metadata/metadataState").MetadataState;
  }>;
  error: typeof import("./features/error/errorState").initialState;
  assets: import("./features/assets/assetsState").AssetsState;
  webTemplates: import("./features/webTemplates/webTemplatesState").WebTemplatesState;
}

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
