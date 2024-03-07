/* eslint-disable @typescript-eslint/no-explicit-any */
import mapValues from "lodash/mapValues";

const filterEvents = (data: any = [], fn: any) => {
  return data.reduce((memo: any, o: any) => {
    if (fn(o)) {
      memo.push({
        ...o,
        children:
          o.children &&
          mapValues(o.children, (childEvents) => filterEvents(childEvents, fn)),
      });
    }
    return memo;
  }, []);
};

const filterSceneEvents = (scene: any, callback: any) => {
  return {
    ...scene,
    script: filterEvents(scene.script, callback),
    playerHit1Script: filterEvents(scene.playerHit1Script, callback),
    playerHit2Script: filterEvents(scene.playerHit2Script, callback),
    playerHit3Script: filterEvents(scene.playerHit3Script, callback),
    actors: scene.actors.map((actor: any) => {
      return {
        ...actor,
        script: filterEvents(actor.script, callback),
        startScript: filterEvents(actor.startScript, callback),
        updateScript: filterEvents(actor.updateScript, callback),
        hit1Script: filterEvents(actor.hit1Script, callback),
        hit2Script: filterEvents(actor.hit2Script, callback),
        hit3Script: filterEvents(actor.hit3Script, callback),
      };
    }),
    triggers: scene.triggers.map((trigger: any) => {
      return {
        ...trigger,
        script: filterEvents(trigger.script, callback),
      };
    }),
  };
};

const filterScenesEvents = (scenes: any, callback: any) => {
  return scenes.map((scene: any) => {
    return filterSceneEvents(scene, callback);
  });
};

const eventHasArg = (event: any, argName: any) => {
  return (
    event.args && Object.prototype.hasOwnProperty.call(event.args, argName)
  );
};

export { filterEvents, filterScenesEvents, filterSceneEvents, eventHasArg };
