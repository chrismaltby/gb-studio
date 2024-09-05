import { Middleware, Dispatch } from "redux";
import {
  actorName,
  customEventName,
  sceneName,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import { RootState } from "store/configureStore";
import consoleActions from "store/features/console/consoleActions";
import {
  customEventSelectors,
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { ConsoleLink } from "./consoleState";

const getLinkToSymbol = (
  symbol: string,
  state: RootState
): ConsoleLink | undefined => {
  const allCustomScripts = customEventSelectors.selectAll(state);
  const allActors = actorSelectors.selectAll(state);
  const allTriggers = triggerSelectors.selectAll(state);
  const allScenes = sceneSelectors.selectAll(state);

  const customScript = allCustomScripts.find((s) => s.symbol === symbol);
  if (customScript) {
    // Matched symbol to a custom script
    return {
      linkText: customEventName(
        customScript,
        allCustomScripts.indexOf(customScript)
      ),
      type: "customEvent",
      entityId: customScript.id,
      sceneId: "",
    };
  }
  const actor = allActors.find((a) => {
    return symbol.startsWith(`${a.symbol}_`);
  });
  if (actor) {
    const scene = allScenes.find((s) => s?.actors.includes(actor.id));
    if (scene) {
      // Matched symbol to an actor
      return {
        linkText: actorName(actor, scene.actors.indexOf(actor.id)),
        type: "actor",
        entityId: actor.id,
        sceneId: scene.id,
      };
    }
  }

  const trigger = allTriggers.find((t) => {
    return symbol.startsWith(`${t.symbol}_`);
  });
  if (trigger) {
    const scene = allScenes.find((s) => s?.triggers.includes(trigger.id));
    if (scene) {
      // Matched symbol to a trigger
      return {
        linkText: triggerName(trigger, scene.triggers.indexOf(trigger.id)),
        type: "trigger",
        entityId: trigger.id,
        sceneId: scene.id,
      };
    }
  }

  const scene = allScenes.find((s) => {
    return symbol.startsWith(`${s.symbol}_`);
  });

  if (scene) {
    // Matched symbol to a scene
    return {
      linkText: sceneName(scene, allScenes.indexOf(scene)),
      type: "scene",
      entityId: scene.id,
      sceneId: scene.id,
    };
  }

  return undefined;
};

const consoleMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (consoleActions.stdErr.match(action)) {
      if (action.payload.text.includes("Object files too large")) {
        const state = store.getState();
        const textLines = action.payload.text.split("\n");
        const tooLargeSymbols = textLines
          .slice(1)
          .map((line) => line.trim().slice(0, -2));
        for (const symbol of tooLargeSymbols) {
          const link = getLinkToSymbol(symbol, state);
          if (link) {
            next({
              ...action,
              payload: {
                text: `Object file too large: ${symbol}.o`,
                link,
              },
            });
            continue;
          }

          // Not sure what entity this relates to, so just output text as is
          next({
            ...action,
            payload: {
              text: `Object file too large: ${symbol}.o`,
            },
          });
        }

        return;
      } else if (action.payload.text.includes("referenced by module")) {
        const symbol = action.payload.text.match(
          /referenced by module '([^']*)'/
        )?.[1];
        if (symbol) {
          const state = store.getState();
          const link = getLinkToSymbol(symbol, state);
          if (link) {
            return next({
              ...action,
              payload: {
                text: action.payload.text,
                link,
              },
            });
          }
        }
      } else if (action.payload.text.includes("removing")) {
        const symbol = action.payload.text.match(
          /removing .*[\\/]([^\\/]*).o/
        )?.[1];
        if (symbol) {
          const state = store.getState();
          const link = getLinkToSymbol(symbol, state);
          if (link) {
            return next({
              ...action,
              payload: {
                text: action.payload.text,
                link,
              },
            });
          }
        }
      }
    }
    return next(action);
  };

export default consoleMiddleware;
