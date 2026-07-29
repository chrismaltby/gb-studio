import API from "renderer/lib/api";
import { findConstantUses } from "renderer/lib/workers/constantUses";
import { findScriptUses } from "renderer/lib/workers/scriptUses";
import rootReducer from "store/rootReducer";
import entitiesActions from "store/features/entities/entitiesActions";
import type { RootState } from "store/storeTypes";
import type {
  EntitiesState,
  ScriptEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import type { AppDispatch } from "store/configureStore";
import { dummyCustomEventNormalized } from "../../../dummydata";

jest.mock("renderer/lib/workers/constantUses", () => ({
  findConstantUses: jest.fn(),
}));
jest.mock("renderer/lib/workers/scriptUses", () => ({
  findScriptUses: jest.fn(),
}));

const baseState = rootReducer(undefined, { type: "@@INIT" }) as RootState;

const constant = {
  id: "constant-1",
  name: "Maximum",
  symbol: "CONST_MAXIMUM",
  value: 10,
};
const customEvent = {
  ...dummyCustomEventNormalized,
  id: "script-1",
  name: "Reusable Script",
};

const makeState = ({
  includeConstant = true,
  includeCustomEvent = true,
  scriptEvents = [],
}: {
  includeConstant?: boolean;
  includeCustomEvent?: boolean;
  scriptEvents?: ScriptEventNormalized[];
} = {}): RootState => {
  const entities: EntitiesState = {
    ...baseState.project.present.entities,
    constants: includeConstant
      ? { ids: [constant.id], entities: { [constant.id]: constant } }
      : { ids: [], entities: {} },
    customEvents: includeCustomEvent
      ? {
          ids: [customEvent.id],
          entities: { [customEvent.id]: customEvent },
        }
      : { ids: [], entities: {} },
    scriptEvents: {
      ids: scriptEvents.map((event) => event.id),
      entities: Object.fromEntries(
        scriptEvents.map((event) => [event.id, event]),
      ),
    },
  };

  return {
    ...baseState,
    project: {
      ...baseState.project,
      present: {
        ...baseState.project.present,
        entities,
      },
    },
  };
};

const runThunk = async (
  thunk: ReturnType<
    | typeof entitiesActions.confirmRemoveConstant
    | typeof entitiesActions.confirmRemoveCustomEvent
  >,
  state: RootState,
) => {
  const dispatch = jest.fn();
  await thunk(dispatch as unknown as AppDispatch, () => state, undefined);
  return dispatch;
};

const variableUse = {
  id: "scene-1",
  type: "scene" as const,
  name: "Opening",
  sceneId: "scene-1",
  scene: {},
  sceneIndex: 0,
  event: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(findConstantUses).mockResolvedValue([]);
  jest.mocked(findScriptUses).mockResolvedValue([]);
  jest.mocked(API.dialog.confirmDeleteConstant).mockResolvedValue(false);
  jest.mocked(API.dialog.confirmDeleteCustomEvent).mockResolvedValue(0);
});

describe("confirmRemoveConstant", () => {
  it("does nothing when the constant does not exist", async () => {
    const dispatch = await runThunk(
      entitiesActions.confirmRemoveConstant(constant.id),
      makeState({ includeConstant: false }),
    );

    expect(findConstantUses).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("removes immediately when there are no uses", async () => {
    const dispatch = await runThunk(
      entitiesActions.confirmRemoveConstant(constant.id),
      makeState(),
    );

    expect(findConstantUses).toHaveBeenCalledWith(
      expect.objectContaining({ constantId: constant.id }),
    );
    expect(API.dialog.confirmDeleteConstant).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      entitiesActions.removeConstant({ constantId: constant.id }),
    );
  });

  it.each([
    ["confirm", 0, 1],
    ["cancel", 1, 0],
  ])(
    "%s after showing its uses",
    async (_label, cancel, expectedDispatches) => {
      jest.mocked(findConstantUses).mockResolvedValue([variableUse as never]);
      jest.mocked(API.dialog.confirmDeleteConstant).mockResolvedValue(cancel);

      const dispatch = await runThunk(
        entitiesActions.confirmRemoveConstant(constant.id),
        makeState(),
      );

      expect(API.dialog.confirmDeleteConstant).toHaveBeenCalledWith("MAXIMUM", [
        "Opening",
      ]);
      expect(dispatch).toHaveBeenCalledTimes(expectedDispatches);
    },
  );
});

describe("confirmRemoveCustomEvent", () => {
  const reference = (id: string): ScriptEventNormalized => ({
    id,
    command: "EVENT_CALL_CUSTOM_EVENT",
    args: { customEventId: customEvent.id },
  });

  it("does nothing when the custom event does not exist", async () => {
    const dispatch = await runThunk(
      entitiesActions.confirmRemoveCustomEvent(customEvent.id),
      makeState({ includeCustomEvent: false }),
    );

    expect(findScriptUses).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("removes immediately when there are no references", async () => {
    const dispatch = await runThunk(
      entitiesActions.confirmRemoveCustomEvent(customEvent.id),
      makeState(),
    );

    expect(findScriptUses).not.toHaveBeenCalled();
    expect(API.dialog.confirmDeleteCustomEvent).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      entitiesActions.removeCustomEvent({
        customEventId: customEvent.id,
        deleteReferences: false,
      }),
    );
  });

  it.each([
    ["delete and clear references", 0, false, 1],
    ["delete including references", 1, true, 1],
    ["cancel", 2, false, 0],
  ])(
    "%s after scanning correlated uses",
    async (_label, button, deleteReferences, expectedDispatches) => {
      jest
        .mocked(findScriptUses)
        .mockResolvedValue([
          { ...variableUse, name: "Scene B" } as never,
          { ...variableUse, id: "scene-2", name: "Scene A" } as never,
          { ...variableUse, id: "scene-3", name: "Scene B" } as never,
          { ...variableUse, type: "custom", name: "Nested Script" } as never,
        ]);
      jest
        .mocked(API.dialog.confirmDeleteCustomEvent)
        .mockResolvedValue(button);

      const dispatch = await runThunk(
        entitiesActions.confirmRemoveCustomEvent(customEvent.id),
        makeState({ scriptEvents: [reference("ref-1"), reference("ref-2")] }),
      );

      expect(findScriptUses).toHaveBeenCalledWith(
        expect.objectContaining({ scriptId: customEvent.id }),
      );
      expect(API.dialog.confirmDeleteCustomEvent).toHaveBeenCalledWith(
        "Reusable Script",
        ["Scene A", "Scene B"],
        2,
      );
      expect(dispatch).toHaveBeenCalledTimes(expectedDispatches);
      if (expectedDispatches) {
        expect(dispatch).toHaveBeenCalledWith(
          entitiesActions.removeCustomEvent({
            customEventId: customEvent.id,
            deleteReferences,
          }),
        );
      }
    },
  );
});
