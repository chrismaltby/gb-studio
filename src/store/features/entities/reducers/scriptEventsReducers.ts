import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import {
  EntitiesState,
  ScriptEventNormalized,
  ScriptEventsRef,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import { updateEntitySymbol } from "shared/lib/entities/entitiesHelpers";
import { isValueNumber } from "shared/lib/scriptValue/types";
import isEqual from "lodash/isEqual";
import { ScriptEventArgs } from "shared/lib/resources/types";
import { scriptEventsAdapter } from "store/features/entities/adapters";
import {
  localScriptEventSelectAll,
  localActorSelectAll,
  localTriggerSelectAll,
  selectScriptIds,
} from "store/features/entities/helpers";

const selectScriptIdsByRef = (
  state: EntitiesState,
  location: ScriptEventsRef,
): string[] | undefined => {
  return selectScriptIds(
    state,
    location.parentType,
    location.parentId,
    location.parentKey,
  );
};

const addScriptEvents: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventIds: string[];
    entityId: string;
    type: ScriptEventParentType;
    key: string;
    insertId?: string;
    before?: boolean;
    data: Omit<ScriptEventNormalized, "id">[];
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );

  if (!script) {
    return;
  }

  const newScriptEvents = action.payload.data.map(
    (scriptEventData, scriptEventIndex) => {
      const newScriptEvent: ScriptEventNormalized = {
        ...scriptEventData,
        id: action.payload.scriptEventIds[scriptEventIndex],
      };
      if (scriptEventData.children) {
        newScriptEvent.children = Object.keys(scriptEventData.children).reduce(
          (memo, key) => {
            memo[key] = [];
            return memo;
          },
          {} as Record<string, string[]>,
        );
      }
      return newScriptEvent;
    },
  );

  const insertIndex = action.payload.insertId
    ? Math.max(
        0,
        script.indexOf(action.payload.insertId || "") +
          (action.payload.before ? 0 : 1),
      )
    : script.length;

  scriptEventsAdapter.addMany(state.scriptEvents, newScriptEvents);
  script.splice(insertIndex, 0, ...action.payload.scriptEventIds);
};

const moveScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    from: ScriptEventsRef;
    to: ScriptEventsRef;
    additionalScriptEventIds: string[];
  }>
> = (state, action) => {
  const from = selectScriptIdsByRef(state, action.payload.from);
  const to = selectScriptIdsByRef(state, action.payload.to);
  if (!from || !to) {
    return;
  }

  const fromIndex = from.indexOf(action.payload.from.scriptEventId);
  let toIndex = to.indexOf(action.payload.to.scriptEventId);
  if (fromIndex === -1) {
    return;
  }
  if (toIndex === -1) {
    toIndex = to.length;
  }

  from.splice(fromIndex, 1);
  if (from === to && fromIndex < toIndex) {
    toIndex--;
  }
  to.splice(
    Math.min(Math.max(toIndex, 0), to.length),
    0,
    action.payload.from.scriptEventId,
  );

  const { additionalScriptEventIds } = action.payload;

  if (additionalScriptEventIds.length > 0) {
    const upperHalfRemainingScriptEventIds = to
      .slice(0, toIndex)
      .filter((c) => !additionalScriptEventIds.includes(c));
    const lowerHalfRemainingScriptEventIds = to
      .slice(toIndex)
      .filter((c) => !additionalScriptEventIds.includes(c));
    const newFrom = from.filter((c) => !additionalScriptEventIds.includes(c));
    const newTo = [
      ...upperHalfRemainingScriptEventIds,
      ...additionalScriptEventIds,
      ...lowerHalfRemainingScriptEventIds,
    ];
    from.length = 0;
    from.push(...newFrom);
    to.length = 0;
    to.push(...newTo);
  }
};

const editScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    changes: Partial<ScriptEventNormalized>;
  }>
> = (state, action) => {
  scriptEventsAdapter.updateOne(state.scriptEvents, {
    id: action.payload.scriptEventId,
    changes: action.payload.changes,
  });
};

const setScriptEventSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ scriptEventId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.scriptEvents,
    scriptEventsAdapter,
    action.payload.scriptEventId,
    action.payload.symbol,
  );
};

const toggleScriptEventOpen: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__collapse = !scriptEvent.args.__collapse;
};

const toggleScriptEventComment: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    additionalScriptEventIds: string[];
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  const newValue = !scriptEvent.args.__comment;
  scriptEvent.args.__comment = newValue;

  // Toggle others in selection to match
  for (const scriptEventId of action.payload.additionalScriptEventIds) {
    const scriptEvent = state.scriptEvents.entities[scriptEventId];
    if (!scriptEvent || !scriptEvent.args) {
      continue;
    }
    scriptEvent.args.__comment = newValue;
  }
};

const toggleScriptEventDisableElse: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__disableElse = !scriptEvent.args.__disableElse;
};

const editScriptEventArg: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    key: string;
    value: unknown;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args[action.payload.key] = action.payload.value;
};

const editScriptEventDestination: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    destSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }

  scriptEvent.args = {
    ...scriptEvent.args,
    sceneId: action.payload.destSceneId,
    x: isValueNumber(scriptEvent.args.x)
      ? { type: "number", value: action.payload.x }
      : scriptEvent.args.x,
    y: isValueNumber(scriptEvent.args.y)
      ? { type: "number", value: action.payload.y }
      : scriptEvent.args.y,
  };
};

const editScriptEventLabel: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    value: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__label = action.payload.value;
};

const groupScriptEvents: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventIds: string[];
    parentId: string;
    parentType: ScriptEventParentType;
    parentKey: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.parentType,
    action.payload.parentId,
    action.payload.parentKey,
  );

  if (!script) {
    return;
  }

  // Check that all script events belong to parent script
  if (!action.payload.scriptEventIds.every((id) => script.includes(id))) {
    return;
  }

  // Use first id in list to determine insert position
  const insertId = action.payload.scriptEventIds[0];
  const insertIndex = insertId
    ? Math.max(0, script.indexOf(insertId || ""))
    : script.length;

  // Remove from previous parent
  for (const scriptEventId of action.payload.scriptEventIds) {
    const eventIndex = script.indexOf(scriptEventId);
    if (eventIndex === -1) {
      continue;
    }
    script.splice(eventIndex, 1);
  }

  // Build parent group
  const groupEvent: ScriptEventNormalized = {
    id: uuid(),
    command: "EVENT_GROUP",
    args: {},
    children: {
      true: action.payload.scriptEventIds,
    },
  };

  // Add group to previous parent
  scriptEventsAdapter.addOne(state.scriptEvents, groupEvent);
  script.splice(insertIndex, 0, groupEvent.id);
};

const resetScript: CaseReducer<
  EntitiesState,
  PayloadAction<{
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );
  if (script) {
    script.splice(0, script.length);
  }
};

const ungroupScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    parentId: string;
    parentType: ScriptEventParentType;
    parentKey: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.parentType,
    action.payload.parentId,
    action.payload.parentKey,
  );

  if (!script) {
    return;
  }

  const groupEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!groupEvent || !groupEvent.children || !groupEvent.children.true) {
    return;
  }

  const eventIndex = script.indexOf(action.payload.scriptEventId);
  if (eventIndex === -1) {
    return;
  }

  script.splice(eventIndex, 1, ...groupEvent.children.true);
  scriptEventsAdapter.removeOne(
    state.scriptEvents,
    action.payload.scriptEventId,
  );
};

const applyScriptEventPresetChanges: CaseReducer<
  EntitiesState,
  PayloadAction<{
    id: string;
    presetId: string;
    name: string;
    groups: string[];
    args: ScriptEventArgs;
    previousArgs: ScriptEventArgs;
  }>
> = (state, action) => {
  const scriptEvents = localScriptEventSelectAll(state);
  const actors = localActorSelectAll(state);
  const triggers = localTriggerSelectAll(state);

  const mergeArgs = (storedArgs?: ScriptEventArgs) => {
    const mergedArgs = { ...storedArgs };
    Object.keys({ ...mergedArgs, ...action.payload.args }).forEach((key) => {
      if (
        (!mergedArgs[key] ||
          isEqual(mergedArgs[key], action.payload.previousArgs[key])) &&
        action.payload.args[key] !== undefined
      ) {
        mergedArgs[key] = action.payload.args[key];
      }
    });
    return mergedArgs;
  };

  const scriptEventUpdates = scriptEvents
    .filter(
      (scriptEvent) =>
        scriptEvent.command === action.payload.id &&
        scriptEvent.args?.__presetId === action.payload.presetId,
    )
    .map((scriptEvent) => ({
      id: scriptEvent.id,
      changes: {
        args: mergeArgs(scriptEvent.args),
      },
    }));

  scriptEventsAdapter.updateMany(state.scriptEvents, scriptEventUpdates);

  // Apply preset to any uses in actor prefab overrides
  actors.forEach((actor) => {
    Object.values(actor.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = mergeArgs(override.args);
      }
    });
  });

  // Apply preset to any uses in trigger prefab overrides
  triggers.forEach((trigger) => {
    Object.values(trigger.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = mergeArgs(override.args);
      }
    });
  });
};

const removeScriptEventPresetReferences: CaseReducer<
  EntitiesState,
  PayloadAction<{
    id: string;
    presetId: string;
  }>
> = (state, action) => {
  const scriptEvents = localScriptEventSelectAll(state);
  const actors = localActorSelectAll(state);
  const triggers = localTriggerSelectAll(state);

  const stripPresetId = (storedArgs?: ScriptEventArgs) => {
    return { ...storedArgs, __presetId: undefined };
  };

  const scriptEventUpdates = scriptEvents
    .filter(
      (scriptEvent) =>
        scriptEvent.command === action.payload.id &&
        scriptEvent.args?.__presetId === action.payload.presetId,
    )
    .map((scriptEvent) => ({
      id: scriptEvent.id,
      changes: {
        args: stripPresetId(scriptEvent.args),
      },
    }));

  scriptEventsAdapter.updateMany(state.scriptEvents, scriptEventUpdates);

  // Remove presetId from any uses in actor prefab overrides
  actors.forEach((actor) => {
    Object.values(actor.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = stripPresetId(override.args);
      }
    });
  });

  // Remove presetId from any uses in trigger prefab overrides
  triggers.forEach((trigger) => {
    Object.values(trigger.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = stripPresetId(override.args);
      }
    });
  });
};

const removeScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );

  if (!script) {
    return;
  }

  const eventIndex = script.indexOf(action.payload.scriptEventId);
  if (eventIndex === -1) {
    return;
  }

  script.splice(eventIndex, 1);
  scriptEventsAdapter.removeOne(
    state.scriptEvents,
    action.payload.scriptEventId,
  );
};

const removeScriptEvents: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventIds: string[];
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );

  if (!script) {
    return;
  }

  for (const scriptEventId of action.payload.scriptEventIds) {
    const eventIndex = script.indexOf(scriptEventId);
    if (eventIndex === -1) {
      continue;
    }
    script.splice(eventIndex, 1);
  }

  scriptEventsAdapter.removeMany(
    state.scriptEvents,
    action.payload.scriptEventIds,
  );
};

const scriptEventsReducers = {
  addScriptEvents: {
    reducer: addScriptEvents,
    prepare: (payload: {
      entityId: string;
      type: ScriptEventParentType;
      key: string;
      insertId?: string;
      before?: boolean;
      data: Omit<ScriptEventNormalized, "id">[];
    }) => {
      return {
        payload: {
          ...payload,
          scriptEventIds: payload.data.map(() => uuid()),
        },
      };
    },
  },

  moveScriptEvent,
  editScriptEvent,
  setScriptEventSymbol,
  groupScriptEvents,
  ungroupScriptEvent,
  applyScriptEventPresetChanges,
  removeScriptEventPresetReferences,
  resetScript,
  toggleScriptEventOpen,
  toggleScriptEventComment,
  toggleScriptEventDisableElse,
  editScriptEventArg,
  editScriptEventDestination,
  editScriptEventLabel,
  removeScriptEvent,
  removeScriptEvents,
} satisfies SliceCaseReducers<EntitiesState>;

export default scriptEventsReducers;
