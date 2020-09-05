import { clipboard } from "electron";
import uniq from "lodash/uniq";
import {
  PASTE_CUSTOM_EVENTS,
} from "../../../actions/actionTypes";
import {
  getCustomEventIdsInEvents,
  getCustomEventIdsInActor,
  getCustomEventIdsInScene,
} from "../../../lib/helpers/eventSystem";
import { Middleware, createAction } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import { Actor, customEventSelectors, ScriptEvent, Trigger, Scene, actorSelectors, triggerSelectors } from "../entities/entitiesSlice";

const copyActor = createAction<Actor>("clipboard/copyActor");
const copyTrigger = createAction<Trigger>("clipboard/copyTrigger");
const copyScene = createAction<Scene>("clipboard/copyScene");
const copyEvent = createAction<ScriptEvent>("clipboard/copyEvent");
const copyScript = createAction<ScriptEvent[]>("clipboard/copyScript");

const clipboardMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (copyActor.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInActor(action.payload));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          actor: action.payload,
          __type: "actor",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );
  } else if (copyTrigger.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents(action.payload.script));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          trigger: action.payload,
          __type: "trigger",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );
  } else if (copyScene.match(action)) {
    const state = store.getState();
    const actors = actorSelectors.selectEntities(state);
    const triggers = triggerSelectors.selectEntities(state);

    const scene = {
      ...action.payload,
      actors: action.payload.actors.map(actorId => actors[actorId]),
      triggers: action.payload.triggers.map(triggerId => triggers[triggerId]),  
    }

    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInScene(scene));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);

    clipboard.writeText(
      JSON.stringify(
        {
          scene,
          __type: "scene",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );  
  } else if (copyEvent.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents([action.payload]));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          event: action.payload,
          __type: "event",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );    
  } else if (copyScript.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents(action.payload));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);    
    clipboard.writeText(
      JSON.stringify(
        {
          script: action.payload,
          __type: "script",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );
  }

  /*
  if (action.type === PASTE_CUSTOM_EVENTS) {

    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__customEvents) {
        const state = store.getState();

        clipboardData.__customEvents.forEach((customEvent) => {
          const customEventsLookup = getCustomEventsLookup(state);
          const existingCustomEvent = customEventsLookup[customEvent.id];

          if (existingCustomEvent) {
            if (JSON.stringify(customEvent) === JSON.stringify(existingCustomEvent)) {
              // Already have this custom event
              return;
            }

            // Display confirmation and stop replace if cancelled
            const cancel = confirmReplaceCustomEvent(
              existingCustomEvent.name,
            );
            if (cancel) {
              return;
            }
          }

          store.dispatch(editCustomEvent(customEvent.id, customEvent))
        });
      }
    } catch (err) {
      // Ignore
    }

  }
*/
  next(action);
};

export const actions = {
  copyActor,
  copyTrigger,
  copyScene,
  copyEvent,
  copyScript
};

export default clipboardMiddleware;
