import { normalize, denormalize, schema, NormalizedSchema } from "normalizr";
import isEqual from "lodash/isEqual";
import pick from "lodash/pick";
import cloneDeep from "lodash/cloneDeep";
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
  Sound,
} from "./entitiesTypes";
import {
  Dictionary,
  EntityAdapter,
  EntityId,
  EntityState,
} from "@reduxjs/toolkit";
import l10n from "lib/helpers/l10n";
import { genSymbol, toValidSymbol } from "lib/helpers/symbols";
import parseAssetPath from "lib/helpers/path/parseAssetPath";

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
  sounds: Record<EntityId, Sound>;
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
  sounds: EntityId[];
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
      filter?: (ScriptEvent: ScriptEvent) => boolean;
      customEvents?: {
        lookup: Dictionary<CustomEvent>;
        maxDepth: number;
        args?: Record<string, unknown>;
      };
    };

const inodeToAssetCache: Dictionary<Asset> = {};

const backgroundSchema = new schema.Entity("backgrounds");
const musicSchema = new schema.Entity("music");
const soundSchema = new schema.Entity("sounds");
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
  sounds: [soundSchema],
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
    sounds: state.sounds.ids,
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
    sounds: state.sounds.entities as Record<EntityId, Sound>,
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
      // If filter is provided skip events that fail filter
      if (options?.filter && !options.filter(scriptEvent)) {
        continue;
      }

      callback(
        replaceCustomEventArgs(scriptEvent, options?.customEvents?.args)
      );
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
        options?.customEvents &&
        scriptEvent.command === "EVENT_CALL_CUSTOM_EVENT"
      ) {
        const customEvent =
          options.customEvents.lookup[
            String(scriptEvent.args?.customEventId || "")
          ];
        if (customEvent) {
          walkNormalisedScriptEvents(
            customEvent.script,
            lookup,
            {
              ...options,
              customEvents: {
                ...options.customEvents,
                maxDepth: options.customEvents.maxDepth - 1,
                args: scriptEvent.args || {},
              },
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
  return scene.name || `${l10n("SCENE")} ${sceneIndex + 1}`;
};

export const customEventName = (
  customEvent: CustomEvent,
  customEventIndex: number
) => {
  return customEvent.name || `${l10n("CUSTOM_EVENT")} ${customEventIndex + 1}`;
};

const extractEntitySymbols = (entities: EntityState<{ symbol?: string }>) => {
  return Object.values(entities.entities).map(
    (entity) => entity?.symbol
  ) as string[];
};

const extractEntityStateSymbols = (state: EntitiesState) => {
  return [
    ...extractEntitySymbols(state.scenes),
    ...extractEntitySymbols(state.actors),
    ...extractEntitySymbols(state.triggers),
    ...extractEntitySymbols(state.backgrounds),
    ...extractEntitySymbols(state.spriteSheets),
    ...extractEntitySymbols(state.emotes),
    ...extractEntitySymbols(state.fonts),
    ...extractEntitySymbols(state.variables),
    ...extractEntitySymbols(state.customEvents),
    ...extractEntitySymbols(state.music),
    ...extractEntitySymbols(state.sounds),
    ...extractEntitySymbols(state.scriptEvents),
  ];
};

export const genEntitySymbol = (state: EntitiesState, name: string) => {
  return genSymbol(name, extractEntityStateSymbols(state));
};

const ensureEntitySymbolsUnique = (
  entities: EntityState<{ symbol?: string }>,
  seenSymbols: string[]
) => {
  for (const entity of Object.values(entities.entities)) {
    if (entity && entity.symbol) {
      entity.symbol = toValidSymbol(entity.symbol);
      if (seenSymbols.includes(entity.symbol)) {
        const newSymbol = genSymbol(entity.symbol, seenSymbols);
        entity.symbol = newSymbol;
      }
      seenSymbols.push(entity.symbol);
    }
  }
};

export const ensureSymbolsUnique = (state: EntitiesState) => {
  const symbols: string[] = [];
  ensureEntitySymbolsUnique(state.scenes, symbols);
  ensureEntitySymbolsUnique(state.actors, symbols);
  ensureEntitySymbolsUnique(state.triggers, symbols);
  ensureEntitySymbolsUnique(state.backgrounds, symbols);
  ensureEntitySymbolsUnique(state.spriteSheets, symbols);
  ensureEntitySymbolsUnique(state.emotes, symbols);
  ensureEntitySymbolsUnique(state.fonts, symbols);
  ensureEntitySymbolsUnique(state.variables, symbols);
  ensureEntitySymbolsUnique(state.customEvents, symbols);
  ensureEntitySymbolsUnique(state.music, symbols);
  ensureEntitySymbolsUnique(state.sounds, symbols);
  ensureEntitySymbolsUnique(state.scriptEvents, symbols);
};

export const mergeAssetEntity = <T extends Asset & { inode: string }>(
  entities: EntityState<T>,
  entity: T,
  keepProps: (keyof T)[]
): T => {
  const existingEntities = entities.ids.map(
    (id) => entities.entities[id]
  ) as T[];

  // Check if asset already exists or was recently deleted
  const existingAsset =
    existingEntities.find(matchAsset(entity)) ||
    inodeToAssetCache[entity.inode];

  if (existingAsset) {
    delete inodeToAssetCache[entity.inode];
    const preferExisting = pick(existingAsset, keepProps);

    return {
      ...existingAsset,
      ...entity,
      ...preferExisting,
    };
  }

  return entity;
};

export const storeRemovedAssetInInodeCache = <
  T extends Asset & { inode: string }
>(
  filename: string,
  projectRoot: string,
  assetFolder: string,
  entities: EntityState<T>
): Asset => {
  const { file, plugin } = parseAssetPath(filename, projectRoot, assetFolder);

  const existingEntities = entities.ids.map(
    (id) => entities.entities[id]
  ) as T[];

  const asset = {
    filename: file,
    plugin,
  };

  const existingAsset = existingEntities.find(matchAsset(asset));

  if (existingAsset) {
    // Store deleted asset in inode cache incase it was just being renamed
    inodeToAssetCache[existingAsset.inode] = existingAsset;
  }

  return asset;
};

/**
 * Upsert entity, preferring some props from existing entity where available
 * @param entities entity state
 * @param adapter entity adapter
 * @param entity entity to upsert
 * @param keepProps array of props to keep
 */
export const upsertAssetEntity = <
  T extends Asset & { id: string; inode: string }
>(
  entities: EntityState<T>,
  adapter: EntityAdapter<T>,
  entity: T,
  keepProps: (keyof T)[]
) => {
  adapter.upsertOne(entities, mergeAssetEntity(entities, entity, keepProps));
};

/**
 * Search entities for matching asset and remove
 * @param entities entity state
 * @param adapter entity adapter
 * @param asset asset to remove
 */
export const removeAssetEntity = <
  T extends Asset & { id: string; inode: string }
>(
  entities: EntityState<T>,
  adapter: EntityAdapter<T>,
  asset: Asset
) => {
  const existingEntities = entities.ids.map(
    (id) => entities.entities[id]
  ) as T[];
  const existingAsset = existingEntities.find(matchAsset(asset));
  if (existingAsset) {
    inodeToAssetCache[existingAsset.inode] = cloneDeep(existingAsset);
    adapter.removeOne(entities, existingAsset.id);
  }
};

export const updateEntitySymbol = <T extends { id: string; symbol?: string }>(
  state: EntitiesState,
  entities: EntityState<T>,
  adapter: EntityAdapter<T>,
  id: string,
  inputSymbol: string
) => {
  const entity = entities.entities[id];
  if (!entity || entity.symbol === inputSymbol) {
    // Entity not found or symbol unchanged
    return;
  }
  const symbol = genEntitySymbol(state, inputSymbol);
  const changes = {
    symbol,
  } as Partial<T>;
  adapter.updateOne(entities, {
    id,
    changes,
  });
};
