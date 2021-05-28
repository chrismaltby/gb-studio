import "jest-extended";
import middleware from "../../../../src/store/features/undo/undoMiddleware";
import { RootState } from "../../../../src/store/configureStore";
import { dummyProjectData } from "../../../dummydata";
import { MiddlewareAPI, Dispatch, AnyAction } from "@reduxjs/toolkit";
import projectActions from "../../../../src/store/features/project/projectActions";
import { ActionCreators } from "redux-undo";

test("Should trigger undo clear history after successful project load", async () => {
  const store = {
    getState: () => ({}),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = projectActions.loadProject.fulfilled(
    {
      data: { ...dummyProjectData },
      path: "project.gbsproj",
      modifiedSpriteIds: [],
    },
    "randomid",
    "project.gbsproj"
  );

  middleware(store)(next)(action);

  expect(store.dispatch).toHaveBeenCalledWith(ActionCreators.clearHistory());
  expect(next).toHaveBeenCalledWith(action);
  expect(next).toHaveBeenCalledBefore(store.dispatch as jest.Mock<any, any>);
});

test("Should not trigger undo clear history after successful project save", async () => {
  const store = {
    getState: () => ({}),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = projectActions.saveProject.fulfilled(
    undefined,
    "randomid",
    undefined
  );

  middleware(store)(next)(action);

  expect(store.dispatch).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(action);
});
