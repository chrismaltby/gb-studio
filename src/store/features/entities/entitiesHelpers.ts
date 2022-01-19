import { normalize, denormalize, schema, NormalizedSchema } from "normalizr";
import isEqual from "lodash/isEqual";
import {
  ProjectEntitiesData,
  EntitiesState,
  Asset,
  SpriteSheet,
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
  Scene,
  Actor,
  Trigger,
  Background,
  Palette,
  Music,
  Font,
  Avatar,
  Emote,
  CustomEvent,
  Variable,
  EngineFieldValue,
  UnionValue,
  UnionDirectionValue,
  UnionNumberValue,
  UnionPropertyValue,
  UnionVariableValue,
  SpriteState,
  SpriteSheetData,
  ScriptEvent,
  ActorScriptKey,
  actorScriptKeys,
  sceneScriptKeys,
  SceneScriptKey,
  TriggerScriptKey,
  triggerScriptKeys,
} from "./entitiesTypes";
import { Dictionary, EntityId } from "@reduxjs/toolkit";
import l10n from "lib/helpers/l10n";

export interface NormalisedEntities {
  scenes: Record<EntityId, Scene>;
  actors: Record<EntityId, Actor>;
  triggers: Record<EntityId, Trigger>;
  scriptEvents: Record<EntityId, ScriptEvent>;
  backgrounds: Record<EntityId, Background>;
  spriteSheets: Record<EntityId, SpriteSheet>;
  metasprites: Record<EntityId, Metasprite>;
  metaspriteTiles: Record<EntityId, MetaspriteTile>;
  spriteAnimations: Record<EntityId, SpriteAnimation>;
  spriteStates: Record<EntityId, SpriteState>;
  palettes: Record<EntityId, Palette>;
  music: Record<EntityId, Music>;
  fonts: Record<EntityId, Font>;
  avatars: Record<EntityId, Avatar>;
  emotes: Record<EntityId, Emote>;
  customEvents: Record<EntityId, CustomEvent>;
  variables: Record<EntityId, Variable>;
  engineFieldValues: Record<EntityId, EngineFieldValue>;
}

export interface NormalisedResult {
  scenes: EntityId[];
  backgrounds: EntityId[];
  spriteSheets: EntityId[];
  palettes: EntityId[];
  customEvents: EntityId[];
  music: EntityId[];
  fonts: EntityId[];
  avatars: EntityId[];
  emotes: EntityId[];
  variables: EntityId[];
  engineFieldValues: EntityId[];
}

export type NormalisedData = NormalizedSchema<
  NormalisedEntities,
  NormalisedResult
>;

type WalkNormalizedOptions =
  | undefined
  | {
      customEventsLookup: Dictionary<CustomEvent>;
      maxDepth: number;
      customEventArgs: Record<string, unknown>;
    };

const backgroundSchema = new schema.Entity("backgrounds");
const musicSchema = new schema.Entity("music");
const fontSchema = new schema.Entity("fonts");
const avatarSchema = new schema.Entity("avatars");
const emoteSchema = new schema.Entity("emotes");

const scriptEventSchema = new schema.Entity("scriptEvents");
scriptEventSchema.define({
  children: new schema.Values([scriptEventSchema]),
});
const actorSchema = new schema.Entity("actors", {
  script: [scriptEventSchema],
  startScript: [scriptEventSchema],
  updateScript: [scriptEventSchema],
  hit1Script: [scriptEventSchema],
  hit2Script: [scriptEventSchema],
  hit3Script: [scriptEventSchema],
});
const triggerSchema = new schema.Entity("triggers", {
  script: [scriptEventSchema],
  leaveScript: [scriptEventSchema],
});
const metaspriteTilesSchema = new schema.Entity("metaspriteTiles");
const metaspritesSchema = new schema.Entity("metasprites", {
  tiles: [metaspriteTilesSchema],
});
const spriteAnimationsSchema = new schema.Entity("spriteAnimations", {
  frames: [metaspritesSchema],
});
const spriteStatesSchema = new schema.Entity("spriteStates", {
  animations: [spriteAnimationsSchema],
});
const spriteSheetsSchema = new schema.Entity("spriteSheets", {
  states: [spriteStatesSchema],
});

const variablesSchema = new schema.Entity("variables");
const sceneSchema = new schema.Entity("scenes", {
  actors: [actorSchema],
  triggers: [triggerSchema],
  script: [scriptEventSchema],
  playerHit1Script: [scriptEventSchema],
  playerHit2Script: [scriptEventSchema],
  playerHit3Script: [scriptEventSchema],
});
const customEventsSchema = new schema.Entity("customEvents", {
  script: [scriptEventSchema],
});
const palettesSchema = new schema.Entity("palettes");
const engineFieldValuesSchema = new schema.Entity("engineFieldValues");

const projectSchema = {
  scenes: [sceneSchema],
  backgrounds: [backgroundSchema],
  music: [musicSchema],
  fonts: [fontSchema],
  avatars: [avatarSchema],
  emotes: [emoteSchema],
  spriteSheets: [spriteSheetsSchema],
  variables: [variablesSchema],
  customEvents: [customEventsSchema],
  palettes: [palettesSchema],
  engineFieldValues: [engineFieldValuesSchema],
};

export const normalizeEntities = (
  projectData: ProjectEntitiesData
): NormalisedData => {
  return normalize<NormalisedEntities, NormalisedResult>(
    projectData,
    projectSchema
  );
};

export const denormalizeEntities = (
  state: EntitiesState
): ProjectEntitiesData => {
  const input: NormalisedResult = {
    scenes: state.scenes.ids,
    backgrounds: state.backgrounds.ids,
    spriteSheets: state.spriteSheets.ids,
    palettes: state.palettes.ids,
    customEvents: state.customEvents.ids,
    music: state.music.ids,
    fonts: state.fonts.ids,
    avatars: state.avatars.ids,
    emotes: state.emotes.ids,
    variables: state.variables.ids,
    engineFieldValues: state.engineFieldValues.ids,
  };
  const entities: NormalisedEntities = {
    actors: state.actors.entities as Record<EntityId, Actor>,
    triggers: state.triggers.entities as Record<EntityId, Trigger>,
    scenes: state.scenes.entities as Record<EntityId, Scene>,
    scriptEvents: state.scriptEvents.entities as Record<EntityId, ScriptEvent>,
    backgrounds: state.backgrounds.entities as Record<EntityId, Background>,
    spriteSheets: state.spriteSheets.entities as Record<EntityId, SpriteSheet>,
    metasprites: state.metasprites.entities as Record<EntityId, Metasprite>,
    metaspriteTiles: state.metaspriteTiles.entities as Record<
      EntityId,
      MetaspriteTile
    >,
    spriteAnimations: state.spriteAnimations.entities as Record<
      EntityId,
      SpriteAnimation
    >,
    spriteStates: state.spriteStates.entities as Record<EntityId, SpriteState>,
    palettes: state.palettes.entities as Record<EntityId, Palette>,
    customEvents: state.customEvents.entities as Record<EntityId, CustomEvent>,
    music: state.music.entities as Record<EntityId, Music>,
    fonts: state.fonts.entities as Record<EntityId, Font>,
    avatars: state.avatars.entities as Record<EntityId, Avatar>,
    emotes: state.emotes.entities as Record<EntityId, Emote>,
    variables: state.variables.entities as Record<EntityId, Variable>,
    engineFieldValues: state.engineFieldValues.entities as Record<
      EntityId,
      EngineFieldValue
    >,
  };
  return denormalize(input, projectSchema, entities);
};

export const denormalizeSprite = ({
  sprite,
  metasprites,
  metaspriteTiles,
  spriteAnimations,
  spriteStates,
}: {
  sprite: SpriteSheet;
  metasprites: Dictionary<Metasprite>;
  metaspriteTiles: Dictionary<MetaspriteTile>;
  spriteAnimations: Dictionary<SpriteAnimation>;
  spriteStates: Dictionary<SpriteState>;
}): SpriteSheetData => {
  const entities = {
    metasprites,
    metaspriteTiles,
    spriteAnimations,
    spriteStates,
  };
  return denormalize(sprite, spriteSheetsSchema, entities);
};

export const matchAsset = (assetA: Asset) => (assetB: Asset) => {
  return assetA.filename === assetB.filename && assetA.plugin === assetB.plugin;
};

export const sortByFilename = (a: Asset, b: Asset) => {
  if (a.filename > b.filename) return 1;
  if (a.filename < b.filename) return -1;
  return 0;
};

export const swap = <T extends unknown>(
  x: number,
  y: number,
  [...xs]: T[]
): T[] => (xs.length > 1 ? (([xs[x], xs[y]] = [xs[y], xs[x]]), xs) : xs);

export const isUnionValue = (input: unknown): input is UnionValue => {
  if (typeof input !== "object") {
    return false;
  }
  if (!input || !("type" in input)) {
    return false;
  }
  return true;
};

export const isUnionVariableValue = (
  input: unknown
): input is UnionVariableValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "variable") {
    return false;
  }
  return true;
};

export const isUnionPropertyValue = (
  input: unknown
): input is UnionPropertyValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "property") {
    return false;
  }
  return true;
};

export const isUnionNumberValue = (
  input: unknown
): input is UnionNumberValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "number") {
    return false;
  }
  return true;
};

export const isUnionDirectionValue = (
  input: unknown
): input is UnionDirectionValue => {
  if (!isUnionValue(input)) {
    return false;
  }
  if (input.type !== "direction") {
    return false;
  }
  return true;
};

export const replaceCustomEventArgs = (
  scriptEvent: ScriptEvent,
  customEventArgs: Record<string, unknown> | undefined
) => {
  if (!customEventArgs) {
    return scriptEvent;
  }
  return {
    ...scriptEvent,
    args: {
      ...scriptEvent.args,
      actorId:
        customEventArgs[`$actor[${scriptEvent.args?.actorId || 0}]$`] ??
        "$self$",
      // @todo Replace other custom event fields
    },
  };
};

export const walkNormalisedScriptEvents = (
  ids: string[] = [],
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  for (let i = 0; i < ids.length; i++) {
    const scriptEvent = lookup[ids[i]];
    if (scriptEvent) {
      callback(replaceCustomEventArgs(scriptEvent, options?.customEventArgs));
      if (
        scriptEvent.children &&
        scriptEvent.command !== "EVENT_CALL_CUSTOM_EVENT"
      ) {
        Object.keys(scriptEvent.children).forEach((key) => {
          const script = scriptEvent.children?.[key];
          if (script) {
            walkNormalisedScriptEvents(script, lookup, options, callback);
          }
        });
      }
      if (
        options?.customEventsLookup &&
        scriptEvent.command === "EVENT_CALL_CUSTOM_EVENT"
      ) {
        const customEvent =
          options.customEventsLookup[
            String(scriptEvent.args?.customEventId || "")
          ];
        if (customEvent) {
          walkNormalisedScriptEvents(
            customEvent.script,
            lookup,
            {
              ...options,
              maxDepth: options.maxDepth - 1,
              customEventArgs: scriptEvent.args || {},
            },
            callback
          );
        }
      }
    }
  }
};

export const walkNormalisedSceneSpecificEvents = (
  scene: Scene,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkNormalisedScriptEvents(scene.script, lookup, options, callback);
  walkNormalisedScriptEvents(scene.playerHit1Script, lookup, options, callback);
  walkNormalisedScriptEvents(scene.playerHit2Script, lookup, options, callback);
  walkNormalisedScriptEvents(scene.playerHit3Script, lookup, options, callback);
};

export const walkNormalisedActorEvents = (
  actor: Actor,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkActorScriptsKeys((key) => {
    walkNormalisedScriptEvents(actor[key], lookup, options, callback);
  });
};

export const walkNormalisedTriggerEvents = (
  trigger: Trigger,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkNormalisedScriptEvents(trigger.script, lookup, options, callback);
  walkNormalisedScriptEvents(trigger.leaveScript, lookup, options, callback);
};

export const walkNormalisedSceneEvents = (
  scene: Scene,
  lookup: Dictionary<ScriptEvent>,
  actorsLookup: Dictionary<Actor>,
  triggersLookup: Dictionary<Trigger>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent, actor?: Actor, trigger?: Trigger) => void
) => {
  walkNormalisedSceneSpecificEvents(scene, lookup, options, (e) =>
    callback(e, undefined, undefined)
  );
  scene.actors.forEach((actorId) => {
    const actor = actorsLookup[actorId];
    if (actor) {
      walkNormalisedActorEvents(actor, lookup, options, (e) =>
        callback(e, actor, undefined)
      );
    }
  });
  scene.triggers.forEach((triggerId) => {
    const trigger = triggersLookup[triggerId];
    if (trigger) {
      walkNormalisedTriggerEvents(trigger, lookup, options, (e) =>
        callback(e, undefined, trigger)
      );
    }
  });
};

export const walkNormalisedCustomEventEvents = (
  customEvent: CustomEvent,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkNormalisedScriptEvents(customEvent.script, lookup, options, callback);
};

export const walkActorScriptsKeys = (
  callback: (scriptKey: ActorScriptKey) => void
) => {
  actorScriptKeys.forEach((key) => callback(key));
};

export const walkTriggerScriptsKeys = (
  callback: (scriptKey: TriggerScriptKey) => void
) => {
  triggerScriptKeys.forEach((key) => callback(key));
};

export const walkSceneScriptsKeys = (
  callback: (scriptKey: SceneScriptKey) => void
) => {
  sceneScriptKeys.forEach((key) => callback(key));
};

export const isNormalisedScriptEqual = (
  idsA: string[] = [],
  lookupA: Dictionary<ScriptEvent>,
  idsB: string[] = [],
  lookupB: Dictionary<ScriptEvent>
) => {
  const scriptAEvents: { args?: Record<string, unknown>; command: string }[] =
    [];
  const scriptBEvents: { args?: Record<string, unknown>; command: string }[] =
    [];
  walkNormalisedScriptEvents(idsA, lookupA, undefined, (scriptEvent) => {
    const { args, command } = scriptEvent;
    scriptAEvents.push({ args, command });
  });
  walkNormalisedScriptEvents(idsB, lookupB, undefined, (scriptEvent) => {
    const { args, command } = scriptEvent;
    scriptBEvents.push({ args, command });
  });
  return isEqual(scriptAEvents, scriptBEvents);
};

export const isCustomEventEqual = (
  customEventA: CustomEvent,
  lookupA: Dictionary<ScriptEvent>,
  customEventB: CustomEvent,
  lookupB: Dictionary<ScriptEvent>
) => {
  const compareA = {
    ...customEventA,
    script: undefined,
    id: undefined,
  };
  const compareB = {
    ...customEventB,
    script: undefined,
    id: undefined,
  };
  if (!isEqual(compareA, compareB)) {
    return false;
  }
  return isNormalisedScriptEqual(
    customEventA.script,
    lookupA,
    customEventB.script,
    lookupB
  );
};

export const actorName = (actor: Actor, actorIndex: number) => {
  return actor.name || `${l10n("ACTOR")} ${actorIndex + 1}`;
};

export const sceneName = (scene: Scene, sceneIndex: number) => {
  return scene.name || `Scene ${sceneIndex + 1}`;
};

export const customEventName = (
  customEvent: CustomEvent,
  customEventIndex: number
) => {
  return customEvent.name || `${l10n("CUSTOM_EVENT")} ${customEventIndex + 1}`;
};
