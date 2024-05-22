import "jest-extended";
import middleware from "../../../../src/store/features/clipboard/clipboardMiddleware";
import actions from "../../../../src/store/features/clipboard/clipboardActions";
import { RootState } from "../../../../src/store/configureStore";
import { dummyActorNormalized } from "../../../dummydata";
import { MiddlewareAPI, Dispatch, AnyAction } from "@reduxjs/toolkit";
import { mocked } from "jest-mock";
import { ClipboardTypeActors } from "../../../../src/store/features/clipboard/clipboardTypes";
import API from "../../../__mocks__/apiMock";

jest.mock("../../../__mocks__/apiMock");

const mockedAPI = mocked(API);
const mockedClipboard = mockedAPI.clipboard;

test("Should be able to copy actor to clipboard", async () => {
  mockedClipboard.writeBuffer.mockClear();

  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            actors: {
              entities: {
                [dummyActorNormalized.id]: dummyActorNormalized,
              },
              ids: [dummyActorNormalized.id],
            },
            customEvents: {
              entities: {},
              ids: [],
            },
            variables: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = actions.copyActors({
    actorIds: [dummyActorNormalized.id],
  });

  await middleware(store)(next)(action);

  expect(next).toHaveBeenCalledWith(action);
  expect(mockedClipboard.writeBuffer).toHaveBeenCalledWith(
    ClipboardTypeActors,
    Buffer.from(
      JSON.stringify({
        actors: [dummyActorNormalized],
        customEvents: [],
        variables: [],
        scriptEvents: [],
      }),
      "utf8"
    )
  );
});

test("Should include referenced variables when copying actor", async () => {
  mockedClipboard.writeBuffer.mockClear();

  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            actors: {
              entities: {
                [dummyActorNormalized.id]: dummyActorNormalized,
              },
              ids: [dummyActorNormalized.id],
            },
            customEvents: {
              entities: {},
              ids: [],
            },
            variables: {
              entities: {
                [`${dummyActorNormalized.id}_L0`]: {
                  id: `${dummyActorNormalized.id}_L0`,
                  name: "Actor Local",
                },
                // eslint-disable-next-line camelcase
                actor2_L0: {
                  id: "actor2_L0",
                  name: "Actor Local",
                },
              },
              ids: [`${dummyActorNormalized.id}_L0`, "actor2_L0"],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<AnyAction>, RootState>;

  const next = jest.fn();
  const action = actions.copyActors({
    actorIds: [dummyActorNormalized.id],
  });

  await middleware(store)(next)(action);

  expect(next).toHaveBeenCalledWith(action);
  expect(mockedClipboard.writeBuffer).toHaveBeenCalledWith(
    ClipboardTypeActors,
    Buffer.from(
      JSON.stringify({
        actors: [dummyActorNormalized],
        customEvents: [],
        variables: [
          {
            id: `${dummyActorNormalized.id}_L0`,
            name: "Actor Local",
          },
        ],
        scriptEvents: [],
      }),
      "utf8"
    )
  );
});
