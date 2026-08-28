import API from "renderer/lib/api";
import buildGameActions, {
  shouldRunWithDebugger,
} from "store/features/buildGame/buildGameActions";
import settingsActions from "store/features/settings/settingsActions";
import { dummyRootState } from "../../../dummydata";
import type { RootState } from "store/storeTypes";

afterEach(() => {
  jest.restoreAllMocks();
});

test("Should select the ejected web template after successful ejection", async () => {
  jest
    .spyOn(API.project, "ejectWebTemplate")
    .mockResolvedValue([{ id: "binjgb", name: "Default (Binjgb)" }]);
  const dispatch = jest.fn();

  await buildGameActions.ejectWebTemplate()(dispatch, jest.fn(), undefined);

  expect(dispatch).toHaveBeenCalledWith(
    settingsActions.editSettings({ webTemplate: "binjgb" }),
  );
});

test("Should keep the current web template when ejection is cancelled", async () => {
  jest.spyOn(API.project, "ejectWebTemplate").mockResolvedValue(undefined);
  const dispatch = jest.fn();

  await buildGameActions.ejectWebTemplate()(dispatch, jest.fn(), undefined);

  expect(dispatch).not.toHaveBeenCalledWith(
    settingsActions.editSettings({ webTemplate: "binjgb" }),
  );
});

test("Should run with debugging when build and run is used with the visible Debugger view", async () => {
  const state: RootState = {
    ...dummyRootState,
    debug: {
      ...dummyRootState.debug,
      activePane: "debugger",
    },
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        settings: {
          ...dummyRootState.project.present.settings,
          buildAndDebugPaneEnabled: true,
        },
      },
    },
  };
  const build = jest.spyOn(API.project, "build").mockResolvedValue(undefined);

  await buildGameActions.buildGame({ buildType: "web" })(
    jest.fn(),
    () => state,
    undefined,
  );

  expect(build).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ debugEnabled: true }),
  );
});

describe("shouldRunWithDebugger", () => {
  test.each([
    [undefined, false, "debugger", false],
    [undefined, true, "buildLog", false],
    [undefined, true, "debugger", true],
    [true, false, "buildLog", true],
    [false, true, "debugger", true],
  ] as const)(
    "explicit=%s paneOpen=%s activePane=%s returns %s",
    (explicit, paneOpen, activePane, expected) => {
      expect(shouldRunWithDebugger(explicit, paneOpen, activePane)).toBe(
        expected,
      );
    },
  );
});
