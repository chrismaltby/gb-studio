/**
 * @jest-environment jsdom
 */

import actions from "../../../../src/store/features/music/musicActions";
import navigationActions from "../../../../src/store/features/navigation/navigationActions";
import { RootState } from "../../../../src/store/configureStore";
import { MiddlewareAPI, Dispatch, UnknownAction } from "@reduxjs/toolkit";
import middleware from "../../../../src/store/features/music/musicMiddleware";

beforeEach(() => {
  jest.resetModules();
});

test("Should pause music when switching section", async () => {
  const store = {
    getState: () => ({
      editor: {
        section: "world",
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const next = jest.fn();
  const action = navigationActions.setSection("settings");

  middleware(store)(next)(action);

  expect(store.dispatch).toBeCalledWith(actions.pauseMusic());
});
