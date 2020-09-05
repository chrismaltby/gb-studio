import { clipboard } from "electron";
import uniq from "lodash/uniq";
import {
  REMOVE_CUSTOM_EVENT,
  PASTE_CUSTOM_EVENTS
} from "../actions/actionTypes";
import confirmDeleteCustomEvent from "../lib/electron/dialog/confirmDeleteCustomEvent";
import confirmReplaceCustomEvent from "../lib/electron/dialog/confirmReplaceCustomEvent";
import {
  getScenes,
  getScenesLookup,
  getCustomEvents,
  getCustomEventsLookup,
  getActorsLookup,
  getTriggersLookup,
} from "../reducers/entitiesReducer";
import { walkEvents, walkSceneSpecificEvents, walkActorEvents, filterEvents } from "../lib/helpers/eventSystem";
import { EVENT_CALL_CUSTOM_EVENT } from "../lib/compiler/eventTypes";
import { editScene, editActor, editTrigger, editCustomEvent } from "../actions";
import l10n from "../lib/helpers/l10n";

export default store => next => action => {
  if (action.type === REMOVE_CUSTOM_EVENT) {
    const state = store.getState();
    const customEvent =
      state.entities.present.entities.customEvents[action.customEventId];
    const customEventIndex = getCustomEvents(state).indexOf(customEvent);
    const customEventName =
      customEvent.name || `${l10n("CUSTOM_EVENT")} ${customEventIndex + 1}`;
    const scenes = getScenes(state);
    const scenesLookup = getScenesLookup(state);
    const actorsLookup = getActorsLookup(state);
    const triggersLookup = getTriggersLookup(state);
    const usedScenes = {};
    const usedActors = {};
    const usedTriggers = {};
    const usedSceneIds = [];

    const isThisEvent = event =>
      event.command === EVENT_CALL_CUSTOM_EVENT &&
      event.args.customEventId === action.customEventId;

    const sceneName = sceneId => {
      const scene = scenesLookup[sceneId];
      const sceneIndex = scenes.indexOf(scene);
      return scene.name || `${l10n("SCENE")} ${sceneIndex + 1}`;
    };

    // Check for uses of this custom event in project
    scenes.forEach(scene => {
      walkSceneSpecificEvents(scene, event => {
        if (isThisEvent(event)) {
          if (!usedScenes[scene.id]) {
            usedScenes[scene.id] = {
              sceneId: scene.id,
              eventIds: []
            };
          }
          usedScenes[scene.id].eventIds.push(event.id);
          usedSceneIds.push(scene.id);
        }
      });
      scene.actors.forEach(actorId => {
        walkActorEvents(actorsLookup[actorId], event => {
          if (isThisEvent(event)) {
            if (!usedActors[actorId]) {
              usedActors[actorId] = {
                sceneId: scene.id,
                eventIds: []
              };
            }            
            usedActors[actorId].eventIds.push(event.id);
            usedSceneIds.push(scene.id);
          }
        });
      });
      scene.triggers.forEach(triggerId => {
        walkEvents(triggersLookup[triggerId].script, event => {
          if (isThisEvent(event)) {
            if (!usedTriggers[triggerId]) {
              usedTriggers[triggerId] = {
                sceneId: scene.id,
                eventIds: []
              };
            }              
            usedTriggers[triggerId].eventIds.push(event.id);
            usedSceneIds.push(scene.id);
          }
        });
      });
    });

    const usedTotal = usedSceneIds.length;

    if (usedTotal > 0) {
      const sceneNames = uniq(
        usedSceneIds.map((sceneId) => sceneName(sceneId))
      ).sort();

      // Display confirmation and stop delete if cancelled
      const cancel = confirmDeleteCustomEvent(
        customEventName,
        sceneNames,
        usedTotal
      );
      if (cancel) {
        return;
      }

      // Remove used instances in scenes
      Object.keys(usedScenes).forEach((sceneId) => {
        const eventIds = usedScenes[sceneId].eventIds;
        
        const filter = (event) => !eventIds.includes(event.id)

        store.dispatch(
          editScene(sceneId, {
            script: filterEvents(scenesLookup[sceneId].script || [], filter),
            playerHit1Script: filterEvents(scenesLookup[sceneId].playerHit1Script || [], filter),
            playerHit2Script: filterEvents(scenesLookup[sceneId].playerHit2Script || [], filter),
            playerHit3Script: filterEvents(scenesLookup[sceneId].playerHit3Script || [], filter),
          })
        );
      });
      // Remove used instances in actors
      Object.keys(usedActors).forEach((actorId) => {
        const eventIds = usedActors[actorId].eventIds;
        const sceneId = usedActors[actorId].sceneId;

        const filter = (event) => !eventIds.includes(event.id)

        store.dispatch(
          editActor(sceneId, actorId, {
            script: filterEvents(actorsLookup[actorId].script || [], filter),
            startScript: filterEvents(actorsLookup[actorId].startScript || [], filter),
            updateScript: filterEvents(actorsLookup[actorId].updateScript || [], filter),
            hit1Script: filterEvents(actorsLookup[actorId].hit1Script || [], filter),
            hit2Script: filterEvents(actorsLookup[actorId].hit2Script || [], filter),
            hit3Script: filterEvents(actorsLookup[actorId].hit3Script || [], filter),
          })
        );
      });
      // Remove used instances in triggers
      Object.keys(usedTriggers).forEach((triggerId) => {
        const eventIds = usedTriggers[triggerId].eventIds;
        const sceneId = usedTriggers[triggerId].sceneId;

        const filter = (event) => !eventIds.includes(event.id)

        store.dispatch(
          editTrigger(sceneId, triggerId, {
            script: filterEvents(triggersLookup[triggerId].script || [], filter)
          })
        );
      });
    }
  } else if (action.type === PASTE_CUSTOM_EVENTS) {

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

  next(action);
};
