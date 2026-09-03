import API from "renderer/lib/api";
import consoleActions from "store/features/console/consoleActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import navigationActions from "store/features/navigation/navigationActions";
import { denormalizeProject } from "store/features/project/projectActions";
import settingsActions from "store/features/settings/settingsActions";
import type { AppThunk } from "store/storeTypes";
import { actions as webTemplatesActions } from "store/features/webTemplates/webTemplatesState";
import type { DebuggerPane } from "store/features/debugger/debuggerState";

export type BuildType = "web" | "rom" | "pocket";
export type ProjectExportType = "src" | "data";

type BuildGameOptions = {
  buildType?: BuildType;
  exportBuild?: boolean;
  debugEnabled?: boolean;
  startSceneId?: string;
  startX?: number;
  startY?: number;
};

export const shouldRunWithDebugger = (
  explicitDebugEnabled: boolean | undefined,
  buildAndDebugPaneEnabled: boolean,
  activePane: DebuggerPane,
): boolean =>
  explicitDebugEnabled === true ||
  (buildAndDebugPaneEnabled && activePane === "debugger");

const openBuildLog = (dispatch: Parameters<AppThunk>[0]) => {
  dispatch(settingsActions.editSettings({ buildAndDebugPaneEnabled: true }));
  dispatch(navigationActions.setSection("world"));
  dispatch(debuggerActions.setActivePane("buildLog"));
};

const buildGame =
  ({
    buildType = "web",
    exportBuild = false,
    debugEnabled = false,
    startSceneId,
    startX,
    startY,
  }: BuildGameOptions = {}): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const state = getState();

    const shouldDebug = shouldRunWithDebugger(
      debugEnabled,
      state.project.present.settings.buildAndDebugPaneEnabled,
      state.debug.activePane,
    );

    if (state.console.status === "cancelled") {
      return;
    }
    if (state.console.status === "running") {
      dispatch(consoleActions.cancelConsole());
      await API.project.buildCancel();
      return;
    }

    dispatch(consoleActions.startConsole());

    const project = denormalizeProject(state.project.present);
    const engineSchema = {
      fields: state.engine.fields,
      sceneTypes: state.engine.sceneTypes,
      consts: state.engine.consts,
    };
    const selectionIds = state.editor.sceneSelectionIds;

    try {
      const buildResult = await API.project.build(
        {
          ...project,
          scenes:
            startSceneId && project.settings.runSceneSelectionOnly
              ? project.scenes.filter(
                  (scene) =>
                    scene.id === startSceneId ||
                    selectionIds.includes(scene.id),
                )
              : project.scenes,
          settings: {
            ...project.settings,
            startSceneId: startSceneId ?? project.settings.startSceneId,
            startX: startX ?? project.settings.startX,
            startY: startY ?? project.settings.startY,
          },
        },
        {
          buildType,
          engineSchema,
          exportBuild,
          debugEnabled: shouldDebug,
        },
      );
      if (buildResult.status === "failed") {
        openBuildLog(dispatch);
      }

      if (buildResult.status === "success") {
        dispatch(debuggerActions.setUsageData(buildResult.usage));
        if (buildResult.debuggerSymbols) {
          dispatch(debuggerActions.setSymbols(buildResult.debuggerSymbols));
          if (!getState().project.present.settings.buildAndDebugPaneEnabled) {
            dispatch(
              settingsActions.editSettings({
                buildAndDebugPaneEnabled: true,
              }),
            );
          }
        }
      }
    } catch {
      openBuildLog(dispatch);
    }
    dispatch(consoleActions.completeConsole());
  };

const deleteBuildCache = (): AppThunk<Promise<void>> => async (dispatch) => {
  await API.app.deleteBuildCache();
  dispatch(consoleActions.clearConsole());
  dispatch(consoleActions.stdOut({ text: "Cleared GB Studio caches" }));
};

const ejectEngine = (): AppThunk => () => {
  API.project.ejectEngine();
};

const ejectWebTemplate = (): AppThunk<Promise<void>> => async (dispatch) => {
  const templates = await API.project.ejectWebTemplate();
  if (templates) {
    dispatch(webTemplatesActions.setWebTemplates(templates));
    dispatch(settingsActions.editSettings({ webTemplate: "binjgb" }));
  }
};

const exportProject =
  (exportType: ProjectExportType): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const state = getState();

    if (state.console.status === "running") {
      return;
    }
    dispatch(consoleActions.startConsole());

    const project = denormalizeProject(state.project.present);
    const engineSchema = {
      fields: state.engine.fields,
      sceneTypes: state.engine.sceneTypes,
      consts: state.engine.consts,
    };
    try {
      await API.project.exportProject(project, engineSchema, exportType);
    } catch {
      openBuildLog(dispatch);
    }

    dispatch(consoleActions.completeConsole());
  };

const buildGameActions = {
  buildGame,
  deleteBuildCache,
  ejectEngine,
  ejectWebTemplate,
  exportProject,
};

export default buildGameActions;
