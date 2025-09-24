import { AppDispatch, RootState } from "store/configureStore";
import { Action } from "redux";

interface Store {
  getState: jest.Mock;
  dispatch: jest.Mock;
}

export const create = (initialState: RootState) => {
  const store: Store = {
    getState: jest.fn(() => initialState),
    dispatch: jest.fn(),
  };
  const next: AppDispatch = jest.fn();

  const invoke = (
    action:
      | Action
      | ((dispatch: AppDispatch, getState: () => RootState) => void),
  ) => thunkMiddleware(store)(next)(action);

  return { store, next, invoke };
};

const thunkMiddleware =
  ({ dispatch, getState }: Store) =>
  (next: AppDispatch) =>
  (
    action:
      | Action
      | ((dispatch: AppDispatch, getState: () => RootState) => void),
  ) => {
    if (typeof action === "function") {
      return action(dispatch, getState);
    }

    return next(action);
  };
