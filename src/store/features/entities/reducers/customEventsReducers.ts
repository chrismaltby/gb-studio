import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EVENT_CALL_CUSTOM_EVENT } from "consts";
import { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import { v4 as uuid } from "uuid";
import {
  EntitiesState,
  ScriptNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  genEntitySymbol,
  updateEntitySymbol,
  defaultLocalisedCustomEventName,
  updateCustomEventArgs,
  applyReparentFolderToCollection,
  applyReparentEntityToCollection,
} from "shared/lib/entities/entitiesHelpers";
import {
  scriptEventsAdapter,
  customEventsAdapter,
} from "store/features/entities/adapters";
import {
  localCustomEventSelectTotal,
  localScriptEventSelectAll,
} from "store/features/entities/helpers";

const addCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    defaults?: Partial<ScriptNormalized>;
  }>
> = (state, action) => {
  const customEventsTotal = localCustomEventSelectTotal(state);
  const newCustomEvent: ScriptNormalized = {
    id: action.payload.customEventId,
    name: defaultLocalisedCustomEventName(customEventsTotal),
    description: "",
    variables: {},
    actors: {},
    ...(action.payload.defaults || {}),
    symbol: genEntitySymbol(state, `script_${customEventsTotal + 1}`),
    script: [],
  };
  customEventsAdapter.addOne(state.customEvents, newCustomEvent);
};

const editCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    changes: Partial<ScriptNormalized>;
  }>
> = (state, action) => {
  const patch = { ...action.payload.changes };
  customEventsAdapter.updateOne(state.customEvents, {
    id: action.payload.customEventId,
    changes: patch,
  });
};

const setCustomEventSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ customEventId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.customEvents,
    customEventsAdapter,
    action.payload.customEventId,
    action.payload.symbol,
  );
};

const removeCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{ customEventId: string; deleteReferences?: boolean }>
> = (state, action) => {
  const allScriptEvents = localScriptEventSelectAll(state);
  const referenceIds: string[] = [];

  for (const scriptEvent of allScriptEvents) {
    if (
      scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
      scriptEvent.args?.customEventId === action.payload.customEventId
    ) {
      referenceIds.push(scriptEvent.id);
    }
  }

  if (action.payload.deleteReferences) {
    scriptEventsAdapter.removeMany(state.scriptEvents, referenceIds);
  } else {
    scriptEventsAdapter.updateMany(
      state.scriptEvents,
      referenceIds.map((id) => ({
        id,
        changes: {
          args: { customEventId: undefined },
        },
      })),
    );
  }

  customEventsAdapter.removeOne(
    state.customEvents,
    action.payload.customEventId,
  );
};

const refreshCustomEventArgs: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    scriptEventDefs: ScriptEventDefs;
  }>
> = (state, action) => {
  const customEvent = state.customEvents.entities[action.payload.customEventId];
  if (!customEvent) {
    return;
  }
  updateCustomEventArgs(
    customEvent,
    state.scriptEvents.entities,
    action.payload.scriptEventDefs,
  );
};

const reparentCustomEventsFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentFolderToCollection(
    state.customEvents.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
};

const reparentCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.customEvents.entities,
    action.payload.customEventId,
    action.payload.toPath,
  );
};

const customEventsReducers = {
  addCustomEvent: {
    reducer: addCustomEvent,
    prepare: (payload?: {
      customEventId?: string;
      defaults?: Partial<ScriptNormalized>;
    }) => {
      return {
        payload: {
          customEventId: payload?.customEventId ?? uuid(),
          defaults: payload?.defaults,
        },
      };
    },
  },

  editCustomEvent,
  setCustomEventSymbol,
  removeCustomEvent,
  refreshCustomEventArgs: {
    reducer: refreshCustomEventArgs,
    prepare: (payload: {
      customEventId: string;
      scriptEventDefs: ScriptEventDefs;
    }) => {
      return {
        payload: {
          customEventId: payload.customEventId,
          scriptEventDefs: payload.scriptEventDefs,
        },
        meta: {
          throttle: 1000,
          key: `refresh_${payload.customEventId}`,
        },
      };
    },
  },
  reparentCustomEventsFolder,
  reparentCustomEvent,
} satisfies SliceCaseReducers<EntitiesState>;

export default customEventsReducers;
