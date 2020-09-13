import "jest-extended";
import middleware from "../../../../src/store/features/clipboard/clipboardMiddleware";
import actions from "../../../../src/store/features/clipboard/clipboardActions";
import { RootState } from "../../../../src/store/configureStore";
import { dummyActor } from "../../../dummydata";
import { MiddlewareAPI, Dispatch, AnyAction } from "@reduxjs/toolkit";
import { clipboard } from "electron";
import { mocked } from "ts-jest/utils";

jest.mock("electron");

const mockedClipboard = mocked(clipboard, true);

test("Should be able to copy actor to clipboard", async () => {

  const store = ({
    getState: () => ({
        project: {
            present: {
                entities: {
                    customEvents: {
                        entities: {},
                        ids: []
                    }
                }
            }
        }
    }),
    dispatch: jest.fn(),
  } as unknown) as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = actions.copyActor({
      ...dummyActor
  })

  middleware(store)(next)(action);

  expect(next).toHaveBeenCalledWith(action);
  expect(mockedClipboard.writeText).toHaveBeenCalledWith(JSON.stringify({
      actor: dummyActor,
      __type: "actor"
  }, null, 4));
});
