import { Dispatch, MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit";
import middleware from "../../../../src/store/features/buildGame/buildGameMiddleware";
import consoleActions from "../../../../src/store/features/console/consoleActions";
import debuggerActions from "../../../../src/store/features/debugger/debuggerActions";
import navigationActions from "../../../../src/store/features/navigation/navigationActions";
import settingsActions from "../../../../src/store/features/settings/settingsActions";
import { RootState } from "store/storeTypes";
import buildGameActions from "store/features/buildGame/buildGameActions";
import API from "renderer/lib/api";

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

  it("selects the ejected web template after successful ejection", async () => {
    jest
      .spyOn(API.project, "ejectWebTemplate")
      .mockResolvedValue([{ id: "binjgb", name: "Default (Binjgb)" }]);
    const store = {
      getState: jest.fn(),
      dispatch: jest.fn(),
    } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

    await middleware(store)(jest.fn())(buildGameActions.ejectWebTemplate());

    expect(store.dispatch).toHaveBeenCalledWith(
      settingsActions.editSettings({ webTemplate: "binjgb" }),
    );
  });

  it("keeps the current web template when ejection is cancelled", async () => {
    jest.spyOn(API.project, "ejectWebTemplate").mockResolvedValue(undefined);
    const store = {
      getState: jest.fn(),
      dispatch: jest.fn(),
    } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

    await middleware(store)(jest.fn())(buildGameActions.ejectWebTemplate());

    expect(store.dispatch).not.toHaveBeenCalledWith(
      settingsActions.editSettings({ webTemplate: "binjgb" }),
    );
  });
});
