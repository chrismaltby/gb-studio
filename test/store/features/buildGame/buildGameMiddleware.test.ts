import { Dispatch, MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit";
import middleware from "../../../../src/store/features/buildGame/buildGameMiddleware";
import consoleActions from "../../../../src/store/features/console/consoleActions";
import debuggerActions from "../../../../src/store/features/debugger/debuggerActions";
import navigationActions from "../../../../src/store/features/navigation/navigationActions";
import settingsActions from "../../../../src/store/features/settings/settingsActions";
import { RootState } from "store/storeTypes";

describe("buildGameMiddleware", () => {
  it("opens the build log when a batched console warning is received", () => {
    const store = {
      getState: () => ({
        project: {
          present: {
            settings: {
              openBuildLogOnWarnings: true,
            },
          },
        },
      }),
      dispatch: jest.fn(),
    } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;
    const next = jest.fn();
    const action = consoleActions.appendMany([
      { type: "out", text: "Compiling" },
      { type: "err", text: "Web template missing" },
    ]);

    middleware(store)(next)(action);

    expect(store.dispatch).toHaveBeenCalledWith(
      settingsActions.editSettings({ debuggerEnabled: true }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      navigationActions.setSection("world"),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      debuggerActions.setIsLogOpen(true),
    );
  });

  it("does not open the build log for batched console output without warnings", () => {
    const store = {
      getState: () => ({
        project: {
          present: {
            settings: {
              openBuildLogOnWarnings: true,
            },
          },
        },
      }),
      dispatch: jest.fn(),
    } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;
    const next = jest.fn();
    const action = consoleActions.appendMany([{ type: "out", text: "Done" }]);

    middleware(store)(next)(action);

    expect(store.dispatch).not.toHaveBeenCalledWith(
      debuggerActions.setIsLogOpen(true),
    );
  });
});
