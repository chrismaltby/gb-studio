import API from "renderer/lib/api";
import buildGameActions from "store/features/buildGame/buildGameActions";
import settingsActions from "store/features/settings/settingsActions";

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
