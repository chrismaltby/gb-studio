import { ipcRenderer, remote } from "electron";
import { Dispatch, Middleware } from "@reduxjs/toolkit";
import Path from "path";
import rimraf from "rimraf";
import { promisify } from "util";
import getTmp from "lib/helpers/getTmp";
import { RootState } from "store/configureStore";
import copy from "lib/helpers/fsCopy";
import consoleActions from "../console/consoleActions";
import navigationActions from "../navigation/navigationActions";
import { denormalizeProject } from "../project/projectActions";
import confirmEjectEngineDialog from "lib/electron/dialog/confirmEjectEngineDialog";
import { statSync } from "fs-extra";
import confirmEjectEngineReplaceDialog from "lib/electron/dialog/confirmEjectEngineReplaceDialog";
import ejectEngineToDir from "lib/project/ejectEngineToDir";
import actions from "./buildGameActions";
import l10n from "lib/helpers/l10n";

const rmdir = promisify(rimraf);

const buildUUID = "_gbsbuild";

const buildGameMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.buildGame.match(action)) {
      const state = store.getState();
      const dispatch = store.dispatch.bind(store);

      const { buildType, exportBuild } = action.payload;
      const buildStartTime = Date.now();

      if (state.console.status === "cancelled") {
        // Wait until cancel is complete before allowing another build
        return;
      }
      if (state.console.status === "running") {
        // Stop build if already building
        store.dispatch(consoleActions.cancelConsole());
        return;
      }

      dispatch(consoleActions.startConsole());

      try {
        const projectRoot = state.document && state.document.root;
        const project = denormalizeProject(state.project.present);
        const colorEnabled = state.project.present.settings.customColorsEnabled;
        const sgbEnabled = state.project.present.settings.sgbEnabled;
        const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);
        const engineFields = state.engine.fields;

        await rmdir(outputRoot);

        const buildProject = await import("lib/compiler/buildProject").then(
          (module) => module.default
        );

        await buildProject(project, {
          projectRoot,
          buildType,
          outputRoot,
          engineFields,
          exportBuild,
          tmpPath: getTmp(),
          profile: state.editor.profile,
          progress: (message) => {
            // Detect if build was cancelled and stop current build
            const state = store.getState();
            if (
              state.console.status === "cancelled" ||
              state.console.status === "complete"
            ) {
              throw new Error(l10n("BUILD_CANCELLED"));
            }

            if (
              message !== "'" &&
              message.indexOf("unknown or unsupported #pragma") === -1
            ) {
              dispatch(consoleActions.stdOut(message));
            }
          },
          warnings: (message) => {
            dispatch(consoleActions.stdErr(message));
          },
        });

        if (exportBuild) {
          await copy(
            `${outputRoot}/build/${buildType}`,
            `${projectRoot}/build/${buildType}`
          );
          remote.shell.openItem(`${projectRoot}/build/${buildType}`);
          dispatch(consoleActions.stdOut("-"));
          dispatch(
            consoleActions.stdOut(
              `Success! ${
                buildType === "web"
                  ? `Site is ready at ${Path.normalize(
                      `${projectRoot}/build/web/index.html`
                    )}`
                  : `ROM is ready at ${Path.normalize(
                      `${projectRoot}/build/rom/game.gb`
                    )}`
              }`
            )
          );
        }

        if (buildType === "web" && !exportBuild) {
          dispatch(consoleActions.stdOut("-"));
          dispatch(consoleActions.stdOut("Success! Starting emulator..."));

          ipcRenderer.send(
            "open-play",
            `file://${outputRoot}/build/web/index.html`,
            sgbEnabled && !colorEnabled
          );
        }

        const buildTime = Date.now() - buildStartTime;

        dispatch(consoleActions.stdOut(`Build Time: ${buildTime}ms`));
        dispatch(consoleActions.completeConsole());
      } catch (e) {
        if (typeof e === "string") {
          dispatch(navigationActions.setSection("build"));
          dispatch(consoleActions.stdErr(e));
        } else if (
          e instanceof Error &&
          e.toString().includes(l10n("BUILD_CANCELLED"))
        ) {
          dispatch(consoleActions.stdOut(l10n("BUILD_CANCELLED")));
        } else {
          dispatch(navigationActions.setSection("build"));
          dispatch(consoleActions.stdErr(e.toString()));
        }
        dispatch(consoleActions.completeConsole());
      }

      if (module.hot) {
        module.hot.accept("lib/compiler/buildProject", () => {
          dispatch(consoleActions.clearConsole());
          dispatch(consoleActions.stdOut("Reloaded GB Studio Compiler"));
        });
      }
    } else if (actions.deleteBuildCache.match(action)) {
      const dispatch = store.dispatch.bind(store);
      const cacheRoot = Path.normalize(`${getTmp()}/_gbscache`);
      await rmdir(cacheRoot);
      dispatch(consoleActions.clearConsole());
      dispatch(consoleActions.stdOut("Cleared GB Studio caches"));
    } else if (actions.ejectEngine.match(action)) {
      const cancel = confirmEjectEngineDialog();

      if (cancel) {
        return;
      }

      const state = store.getState();
      const outputDir = Path.join(state.document.root, "assets", "engine");

      let ejectedEngineExists;
      try {
        statSync(outputDir);
        ejectedEngineExists = true;
      } catch (e) {
        ejectedEngineExists = false;
      }

      if (ejectedEngineExists) {
        const cancel2 = confirmEjectEngineReplaceDialog();
        if (cancel2) {
          return;
        }
      }

      ejectEngineToDir(outputDir).then(() => {
        remote.shell.openItem(outputDir);
      });
    } else if (actions.exportProject.match(action)) {
      const state = store.getState();
      const dispatch = store.dispatch.bind(store);

      if (state.console.status === "running") {
        // Stop build if already building
        return;
      }

      const exportType = action.payload;

      const buildStartTime = Date.now();

      dispatch(consoleActions.startConsole());

      try {
        const projectRoot = state.document && state.document.root;
        const project = denormalizeProject(state.project.present);
        const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);
        const engineFields = state.engine.fields;

        const progress = (message: string) => {
          if (
            message !== "'" &&
            message.indexOf("unknown or unsupported #pragma") === -1
          ) {
            dispatch(consoleActions.stdOut(message));
          }
        };
        const warnings = (message: string) => {
          dispatch(consoleActions.stdErr(message));
        };

        const compileData = await import("lib/compiler/compileData").then(
          (module) => module.default
        );

        const ejectBuild = await import("lib/compiler/ejectBuild").then(
          (module) => module.default
        );

        const tmpPath = getTmp();

        // Compile project data
        const compiledData = await compileData(project, {
          projectRoot,
          engineFields,
          tmpPath,
          progress,
          warnings,
        });

        // Export compiled data to a folder
        await ejectBuild({
          projectRoot,
          tmpPath,
          projectData: project,
          engineFields,
          outputRoot,
          compiledData,
          progress,
          warnings,
        });

        const exportRoot = `${projectRoot}/build/src`;

        if (exportType === "data") {
          const dataSrcTmpPath = Path.join(outputRoot, "src", "data");
          const dataSrcOutPath = Path.join(exportRoot, "src", "data");
          const dataIncludeTmpPath = Path.join(outputRoot, "include", "data");
          const dataIncludeOutPath = Path.join(exportRoot, "include", "data");
          await rmdir(dataSrcOutPath);
          await rmdir(dataIncludeOutPath);
          await copy(dataSrcTmpPath, dataSrcOutPath);
          await copy(dataIncludeTmpPath, dataIncludeOutPath);
        } else {
          await copy(outputRoot, exportRoot);
        }

        const buildTime = Date.now() - buildStartTime;
        dispatch(consoleActions.stdOut(`Build Time: ${buildTime}ms`));
        dispatch(consoleActions.completeConsole());

        remote.shell.openItem(exportRoot);
      } catch (e) {
        if (typeof e === "string") {
          dispatch(navigationActions.setSection("build"));
          dispatch(consoleActions.stdErr(e));
        } else {
          dispatch(navigationActions.setSection("build"));
          dispatch(consoleActions.stdErr(e.toString()));
        }
        dispatch(consoleActions.completeConsole());
        throw e;
      }
    }

    return next(action);
  };

export default buildGameMiddleware;

if (module.hot) {
  module.hot.accept("lib/compiler/buildProject");
}
