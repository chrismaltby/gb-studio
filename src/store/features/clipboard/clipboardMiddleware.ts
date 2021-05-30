import { clipboard } from "electron";
import uniq from "lodash/uniq";
import {
  getCustomEventIdsInEvents,
  getCustomEventIdsInActor,
  getCustomEventIdsInScene,
} from "../../../lib/helpers/eventSystem";
import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import {
  customEventSelectors,
  actorSelectors,
  triggerSelectors,
  variableSelectors,
} from "../entities/entitiesState";
import {
  CustomEvent,
} from "../entities/entitiesTypes";
import actions from "./clipboardActions";
import entitiesActions from "../entities/entitiesActions";

import confirmReplaceCustomEvent from "../../../lib/electron/dialog/confirmReplaceCustomEvent";

const clipboardMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (actions.copyActor.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInActor(action.payload));
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    const allVariables = variableSelectors.selectAll(state);
    const usedVariables = allVariables.filter((variable) => {
      return variable.id.startsWith(action.payload.id);
    });
    clipboard.writeText(
      JSON.stringify(
        {
          actor: action.payload,
          __type: "actor",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          __variables:
            usedVariables.length > 0 ? usedVariables : undefined
        },
        null,
        4
      )
    );
  } else if (actions.copyTrigger.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(
      getCustomEventIdsInEvents(action.payload.script)
    );
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    const allVariables = variableSelectors.selectAll(state);
    const usedVariables = allVariables.filter((variable) => {
      return variable.id.startsWith(action.payload.id);
    });      
    clipboard.writeText(
      JSON.stringify(
        {
          trigger: action.payload,
          __type: "trigger",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          __variables:
            usedVariables.length > 0 ? usedVariables : undefined            
        },
        null,
        4
      )
    );
  } else if (actions.copyScene.match(action)) {
    const state = store.getState();
    const actors = actorSelectors.selectEntities(state);
    const triggers = triggerSelectors.selectEntities(state);

    const scene = {
      ...action.payload,
      actors: action.payload.actors.map((actorId) => actors[actorId]),
      triggers: action.payload.triggers.map((triggerId) => triggers[triggerId]),
    };

    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInScene(scene));
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    const allVariables = variableSelectors.selectAll(state);

    const entityIds = [action.payload.id, ...action.payload.actors, ...action.payload.triggers];
    console.log({entityIds})
    const usedVariables = allVariables.filter((variable) => {
      return entityIds.find((id) => variable.id.startsWith(id))
    });   

    clipboard.writeText(
      JSON.stringify(
        {
          scene,
          __type: "scene",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          __variables:
            usedVariables.length > 0 ? usedVariables : undefined
        },
        null,
        4
      )
    );
  } else if (actions.copyEvent.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(
      getCustomEventIdsInEvents([action.payload])
    );
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          event: action.payload,
          __type: "event",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
        },
        null,
        4
      )
    );
  } else if (actions.copyScript.match(action)) {
    const state = store.getState();
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents(action.payload));
    const usedCustomEvents = usedCustomEventIds
      .map((id) => customEventsLookup[id])
      .filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          script: action.payload,
          __type: "script",
          __customEvents:
            usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
        },
        null,
        4
      )
    );
  } else if (actions.pasteCustomEvents.match(action)) {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__customEvents) {
        const state = store.getState();

        clipboardData.__customEvents.forEach((customEvent: CustomEvent) => {
          const customEventsLookup = customEventSelectors.selectEntities(state);
          const existingCustomEvent = customEventsLookup[customEvent.id];

          if (existingCustomEvent) {
            if (
              JSON.stringify(customEvent) ===
              JSON.stringify(existingCustomEvent)
            ) {
              // Already have this custom event
              return;
            }

            // Display confirmation and stop replace if cancelled
            const cancel = confirmReplaceCustomEvent(existingCustomEvent.name);
            if (cancel) {
              return;
            }
          }

          store.dispatch(
            entitiesActions.editCustomEvent({
              customEventId: customEvent.id,
              changes: customEvent,
            })
          );
        });
      }
    } catch (err) {
      // Ignore
    }
  } else if (actions.copyText.match(action)) {
    clipboard.writeText(action.payload);
  }

  next(action);
};

export default clipboardMiddleware;
