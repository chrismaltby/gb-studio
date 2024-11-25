import { normalize, denormalize, schema, NormalizedSchema } from "normalizr";
import pick from "lodash/pick";
import cloneDeep from "lodash/cloneDeep";
import {
  EntitiesState,
  SpriteSheetNormalized,
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
  SceneNormalized,
  ActorNormalized,
  TriggerNormalized,
  Background,
  Palette,
  Music,
  Font,
  Avatar,
  Emote,
  CustomEventNormalized,
  Variable,
  EngineFieldValue,
  UnionValue,
  UnionDirectionValue,
  UnionNumberValue,
  UnionPropertyValue,
  UnionVariableValue,
  SpriteState,
  SpriteSheetData,
  ScriptEventNormalized,
  Sound,
  Tileset,
  CustomEventVariable,
  CustomEventActor,
  Actor,
  Scene,
  CustomEvent,
  Trigger,
  SpriteSheet,
  ActorPrefab,
  ActorPrefabNormalized,
  ActorScriptKey,
  TriggerPrefab,
  TriggerPrefabNormalized,
  TriggerScriptKey,
  ScriptEvent,
} from "shared/lib/entities/entitiesTypes";
import { EntityAdapter, EntityId, EntityState } from "@reduxjs/toolkit";
import { genSymbol, toValidSymbol } from "shared/lib/helpers/symbols";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { COLLISION_SLOPE_VALUES } from "consts";
import { Asset, assetNameFromFilename } from "shared/lib/helpers/assets";
import l10n from "shared/lib/lang/l10n";
import isEqual from "lodash/isEqual";
import { isNormalizedScriptEqual } from "shared/lib/scripts/scriptHelpers";
import {
  ScriptEventDefs,
  isActorField,
  isPropertyField,
  isScriptValueField,
  isVariableField,
} from "shared/lib/scripts/scriptDefHelpers";
import {
  filterEvents,
  walkActorScriptsKeys,
  walkNormalizedScript,
  walkSceneScriptsKeys,
  walkTriggerScriptsKeys,
} from "shared/lib/scripts/walk";
import {
  extractScriptValueActorIds,
  extractScriptValueVariables,
} from "shared/lib/scriptValue/helpers";
import { ScriptValue, isScriptValue } from "shared/lib/scriptValue/types";
import { sortByKey } from "shared/lib/helpers/sortByKey";
import { Constant, ProjectEntityResources } from "shared/lib/resources/types";

export interface NormalizedEntities {
  scenes: Record<EntityId, SceneNormalized>;
  actors: Record<EntityId, ActorNormalized>;
  triggers: Record<EntityId, TriggerNormalized>;
  scriptEvents: Record<EntityId, ScriptEventNormalized>;
  backgrounds: Record<EntityId, Background>;
  sprites: Record<EntityId, SpriteSheetNormalized>;
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
  tilesets: Record<EntityId, Tileset>;
  actorPrefabs: Record<EntityId, ActorPrefabNormalized>;
  triggerPrefabs: Record<EntityId, TriggerPrefabNormalized>;
  scripts: Record<EntityId, CustomEventNormalized>;
  variables: Record<EntityId, Variable>;
  constants: Record<EntityId, Constant>;
  engineFieldValues: Record<EntityId, EngineFieldValue>;
}

export interface NormalizedResult {
  scenes: EntityId[];
  actors: EntityId[];
  triggers: EntityId[];
  backgrounds: EntityId[];
  spriteSheets: EntityId[];
  palettes: EntityId[];
  actorPrefabs: EntityId[];
  triggerPrefabs: EntityId[];
  scripts: EntityId[];
  music: EntityId[];
  sounds: EntityId[];
  fonts: EntityId[];
  avatars: EntityId[];
  emotes: EntityId[];
  tilesets: EntityId[];
  variables: EntityId[];
  constants: EntityId[];
  variableResources: EntityId[];
  engineFieldValues: EntityId[];
}

export type NormalizedData = NormalizedSchema<
  NormalizedEntities,
  NormalizedResult
>;

type NamedEntity = { name: string };

export interface DenormalizedEntities {
  actors: Actor[];
  avatars: Avatar[];
  backgrounds: Background[];
  emotes: Emote[];
  engineFieldValues: {
    engineFieldValues: EngineFieldValue[];
  };
  fonts: Font[];
  music: Music[];
  palettes: Palette[];
  scenes: Scene[];
  scripts: CustomEvent[];
  sounds: Sound[];
  sprites: SpriteSheet[];
  tilesets: Tileset[];
  triggers: Trigger[];
  variables: {
    constants: Constant[];
    variables: Variable[];
  };
  actorPrefabs: ActorPrefab[];
  triggerPrefabs: TriggerPrefab[];
}

const inodeToAssetCache: Record<string, Asset> = {};

const backgroundSchema = new schema.Entity("backgrounds");
const musicSchema = new schema.Entity("music");
const soundSchema = new schema.Entity("sounds");
const fontSchema = new schema.Entity("fonts");
const avatarSchema = new schema.Entity("avatars");
const emoteSchema = new schema.Entity("emotes");
const tilesetSchema = new schema.Entity("tilesets");

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
const actorPrefabSchema = new schema.Entity("actorPrefabs", {
  script: [scriptEventSchema],
  startScript: [scriptEventSchema],
  updateScript: [scriptEventSchema],
  hit1Script: [scriptEventSchema],
  hit2Script: [scriptEventSchema],
  hit3Script: [scriptEventSchema],
});
const triggerPrefabSchema = new schema.Entity("triggerPrefabs", {
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
const spritesSchema = new schema.Entity("sprites", {
  states: [spriteStatesSchema],
});
const variablesSchema = new schema.Entity("variables");
const constantsSchema = new schema.Entity("constants");
const variablesResourceSchema = new schema.Entity("variableResources", {
  variables: [variablesSchema],
  constants: [constantsSchema],
});
const sceneSchema = new schema.Entity("scenes", {
  actors: [actorSchema],
  triggers: [triggerSchema],
  script: [scriptEventSchema],
  playerHit1Script: [scriptEventSchema],
  playerHit2Script: [scriptEventSchema],
  playerHit3Script: [scriptEventSchema],
});
const scriptsSchema = new schema.Entity("scripts", {
  script: [scriptEventSchema],
});
const palettesSchema = new schema.Entity("palettes");
const engineFieldValuesSchema = new schema.Entity("engineFieldValues");
const engineFieldValuesResourceSchema = new schema.Entity(
  "engineFieldValueResources",
  {
    engineFieldValues: [engineFieldValuesSchema],
  }
);

const resourcesSchema = {
  scenes: [sceneSchema],
  actors: [actorSchema],
  triggers: [triggerSchema],
  actorPrefabs: [actorPrefabSchema],
  triggerPrefabs: [triggerPrefabSchema],
  backgrounds: [backgroundSchema],
  music: [musicSchema],
  sounds: [soundSchema],
  fonts: [fontSchema],
  avatars: [avatarSchema],
  emotes: [emoteSchema],
  tilesets: [tilesetSchema],
  sprites: [spritesSchema],
  variables: variablesResourceSchema,
  scripts: [scriptsSchema],
  palettes: [palettesSchema],
  engineFieldValues: engineFieldValuesResourceSchema,
};

export const normalizeEntityResources = (
  projectResources: ProjectEntityResources
): NormalizedData => {
  return normalize(projectResources, resourcesSchema);
};

export const denormalizeEntities = (
  state: EntitiesState
): ProjectEntityResources => {
  const input = {
    scenes: state.scenes.ids,
    actors: state.actors.ids,
    triggers: state.triggers.ids,
    actorPrefabs: state.actorPrefabs.ids,
    triggerPrefabs: state.triggerPrefabs.ids,
    backgrounds: state.backgrounds.ids,
    sprites: state.spriteSheets.ids,
    palettes: state.palettes.ids,
    scripts: state.customEvents.ids,
    music: state.music.ids,
    sounds: state.sounds.ids,
    fonts: state.fonts.ids,
    avatars: state.avatars.ids,
    emotes: state.emotes.ids,
    tilesets: state.tilesets.ids,
    variables: "variables",
    engineFieldValues: "engineFieldValues",
  };
  const entities = {
    actors: state.actors.entities as Record<EntityId, ActorNormalized>,
    triggers: state.triggers.entities as Record<EntityId, TriggerNormalized>,
    scenes: state.scenes.entities as Record<EntityId, SceneNormalized>,
    actorPrefabs: state.actorPrefabs.entities as Record<
      EntityId,
      ActorPrefabNormalized
    >,
    triggerPrefabs: state.triggerPrefabs.entities as Record<
      EntityId,
      TriggerPrefabNormalized
    >,
    scriptEvents: state.scriptEvents.entities as Record<
      EntityId,
      ScriptEventNormalized
    >,
    backgrounds: state.backgrounds.entities as Record<EntityId, Background>,
    sprites: state.spriteSheets.entities as Record<
      EntityId,
      SpriteSheetNormalized
    >,
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
    scripts: state.customEvents.entities as Record<
      EntityId,
      CustomEventNormalized
    >,
    music: state.music.entities as Record<EntityId, Music>,
    sounds: state.sounds.entities as Record<EntityId, Sound>,
    fonts: state.fonts.entities as Record<EntityId, Font>,
    avatars: state.avatars.entities as Record<EntityId, Avatar>,
    emotes: state.emotes.entities as Record<EntityId, Emote>,
    tilesets: state.tilesets.entities as Record<EntityId, Tileset>,
    variableResources: {
      variables: {
        variables: state.variables.ids,
        constants: state.constants.ids,
      },
    },
    variables: state.variables.entities as Record<EntityId, Variable>,
    constants: state.constants.entities as Record<EntityId, Constant>,
    engineFieldValueResources: {
      engineFieldValues: { engineFieldValues: state.engineFieldValues.ids },
    },
    engineFieldValues: state.engineFieldValues.entities as Record<
      EntityId,
      EngineFieldValue
    >,
  };
  const denormalizedEntities: DenormalizedEntities = denormalize(
    input,
    resourcesSchema,
    entities
  );

  const entityToResource =
    <R extends string>(resourceType: R) =>
    <T>(entity: T): T & { _resourceType: R } => ({
      ...entity,
      _resourceType: resourceType,
      inode: undefined,
      _v: undefined,
    });

  const denormalizedEntityResources: ProjectEntityResources = {
    scenes: denormalizedEntities.scenes.map((scene, sceneIndex) => ({
      _index: sceneIndex,
      ...entityToResource("scene")(sceneFixNulls(scene)),
      actors: scene.actors.map((actor, actorIndex) => ({
        ...entityToResource("actor")(actorFixNulls(actor)),
        _index: actorIndex,
      })),
      triggers: scene.triggers.map((trigger, triggerIndex) => ({
        ...entityToResource("trigger")(triggerFixNulls(trigger)),
        _index: triggerIndex,
      })),
    })),
    actorPrefabs: denormalizedEntities.actorPrefabs.map((actorPrefab) =>
      entityToResource("actorPrefab")(actorFixNulls(actorPrefab))
    ),
    triggerPrefabs: denormalizedEntities.triggerPrefabs.map((triggerPrefab) =>
      entityToResource("triggerPrefab")(triggerFixNulls(triggerPrefab))
    ),
    backgrounds: denormalizedEntities.backgrounds.map(
      entityToResource("background")
    ),
    sprites: denormalizedEntities.sprites.map(entityToResource("sprite")),
    music: denormalizedEntities.music.map(entityToResource("music")),
    scripts: denormalizedEntities.scripts.map((script) =>
      entityToResource("script")(scriptFixNulls(script))
    ),
    palettes: denormalizedEntities.palettes.map(entityToResource("palette")),
    emotes: denormalizedEntities.emotes.map(entityToResource("emote")),
    avatars: denormalizedEntities.avatars.map(entityToResource("avatar")),
    fonts: denormalizedEntities.fonts.map(entityToResource("font")),
    tilesets: denormalizedEntities.tilesets.map(entityToResource("tileset")),
    sounds: denormalizedEntities.sounds.map(entityToResource("sound")),
    engineFieldValues: entityToResource("engineFieldValues")(
      denormalizedEntities.engineFieldValues
    ),
    variables: entityToResource("variables")(denormalizedEntities.variables),
  };

  return denormalizedEntityResources;
};

export const denormalizeSprite = ({
  sprite,
  metasprites,
  metaspriteTiles,
  spriteAnimations,
  spriteStates,
}: {
  sprite: SpriteSheetNormalized;
  metasprites: Record<string, Metasprite>;
  metaspriteTiles: Record<string, MetaspriteTile>;
  spriteAnimations: Record<string, SpriteAnimation>;
  spriteStates: Record<string, SpriteState>;
}): SpriteSheetData => {
  const entities = {
    metasprites,
    metaspriteTiles,
    spriteAnimations,
    spriteStates,
  };
  return denormalize(sprite, spriteSheetsSchema, entities);
};

export const normalizeSprite = (
  sprite: SpriteSheet
): {
  entities: {
    spriteSheets: Record<string, SpriteSheetNormalized>;
    metasprites: Record<string, Metasprite> | undefined;
    metaspriteTiles: Record<string, MetaspriteTile> | undefined;
    spriteAnimations: Record<string, SpriteAnimation> | undefined;
    spriteStates: Record<string, SpriteState> | undefined;
  };
  result: string;
} => {
  return normalize(sprite, spriteSheetsSchema);
};

export const matchAsset = (assetA: Asset) => (assetB: Asset) => {
  return assetA.filename === assetB.filename && assetA.plugin === assetB.plugin;
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export const sortByFilename = (a: Asset, b: Asset) => {
  return collator.compare(a.filename, b.filename);
};

export const swapArrayElement = <T>(x: number, y: number, [...xs]: T[]): T[] =>
  xs.length > 1 ? (([xs[x], xs[y]] = [xs[y], xs[x]]), xs) : xs;

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

export const toVariableNumber = (variable: string) => {
  return variable.replace(/[^0-9]/g, "");
};

export const localVariableCodes = ["L0", "L1", "L2", "L3", "L4", "L5"];

export const isVariableLocal = (variable: string) => {
  return localVariableCodes.indexOf(variable) > -1;
};

export const isVariableTemp = (variable: string) => {
  return ["T0", "T1"].indexOf(variable) > -1;
};

export const isVariableCustomEvent = (variable: string) => {
  return (
    ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9"].indexOf(
      variable
    ) > -1
  );
};

export const isCustomEventEqual = (
  customEventA: CustomEventNormalized,
  lookupA: Record<string, ScriptEventNormalized>,
  customEventB: CustomEventNormalized,
  lookupB: Record<string, ScriptEventNormalized>
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
  return isNormalizedScriptEqual(
    customEventA.script,
    lookupA,
    customEventB.script,
    lookupB
  );
};

export const isActorPrefabEqual = (
  prefabA: ActorPrefabNormalized,
  lookupA: Record<string, ScriptEventNormalized>,
  prefabB: ActorPrefabNormalized,
  lookupB: Record<string, ScriptEventNormalized>
) => {
  type CompareType = Omit<ActorPrefabNormalized, ActorScriptKey | "id"> &
    Record<ActorScriptKey | "id", undefined>;

  const compareA: CompareType = {
    ...prefabA,
    id: undefined,
    script: undefined,
    startScript: undefined,
    updateScript: undefined,
    hit1Script: undefined,
    hit2Script: undefined,
    hit3Script: undefined,
  };
  const compareB: CompareType = {
    ...prefabB,
    id: undefined,
    script: undefined,
    startScript: undefined,
    updateScript: undefined,
    hit1Script: undefined,
    hit2Script: undefined,
    hit3Script: undefined,
  };
  if (!isEqual(compareA, compareB)) {
    return false;
  }
  let scriptMatch = true;
  walkActorScriptsKeys((key) => {
    if (!scriptMatch) {
      return;
    }
    scriptMatch = isNormalizedScriptEqual(
      prefabA[key],
      lookupA,
      prefabB[key],
      lookupB
    );
  });
  return scriptMatch;
};

export const isTriggerPrefabEqual = (
  prefabA: TriggerPrefabNormalized,
  lookupA: Record<string, ScriptEventNormalized>,
  prefabB: TriggerPrefabNormalized,
  lookupB: Record<string, ScriptEventNormalized>
) => {
  type CompareType = Omit<TriggerPrefabNormalized, TriggerScriptKey | "id"> &
    Record<TriggerScriptKey | "id", undefined>;

  const compareA: CompareType = {
    ...prefabA,
    id: undefined,
    script: undefined,
    leaveScript: undefined,
  };
  const compareB: CompareType = {
    ...prefabB,
    id: undefined,
    script: undefined,
    leaveScript: undefined,
  };
  if (!isEqual(compareA, compareB)) {
    return false;
  }
  let scriptMatch = true;
  walkTriggerScriptsKeys((key) => {
    if (!scriptMatch) {
      return;
    }
    scriptMatch = isNormalizedScriptEqual(
      prefabA[key],
      lookupA,
      prefabB[key],
      lookupB
    );
  });
  return scriptMatch;
};

export const actorName = (actor: NamedEntity, actorIndex: number) => {
  return actor.name || defaultLocalisedActorName(actorIndex);
};

export const triggerName = (trigger: NamedEntity, triggerIndex: number) => {
  return trigger.name || defaultLocalisedTriggerName(triggerIndex);
};

export const sceneName = (scene: NamedEntity, sceneIndex: number) => {
  return scene.name || defaultLocalisedSceneName(sceneIndex);
};

export const customEventName = (
  customEvent: NamedEntity,
  customEventIndex: number
) => {
  return customEvent.name || defaultLocalisedCustomEventName(customEventIndex);
};

export const constantName = (constant: NamedEntity, constantIndex: number) => {
  return (constant.name || defaultLocalisedConstantName(constantIndex))
    .toLocaleUpperCase()
    .replace(/\s/g, "_");
};

export const paletteName = (palette: Palette, paletteIndex: number) => {
  // If we have a default name for a palette, use the localized version
  if (palette.defaultName) {
    switch (palette.id) {
      case "default-bg-1":
        return l10n("FIELD_PALETTE_DEFAULT_BG_N", { n: 1 });
      case "default-bg-2":
        return l10n("FIELD_PALETTE_DEFAULT_BG_N", { n: 2 });
      case "default-bg-3":
        return l10n("FIELD_PALETTE_DEFAULT_BG_N", { n: 3 });
      case "default-bg-4":
        return l10n("FIELD_PALETTE_DEFAULT_BG_N", { n: 4 });
      case "default-bg-5":
        return l10n("FIELD_PALETTE_DEFAULT_BG_N", { n: 5 });
      case "default-bg-6":
        return l10n("FIELD_PALETTE_DEFAULT_BG_N", { n: 6 });
      case "default-sprite":
        return l10n("FIELD_PALETTE_DEFAULT_SPRITES");
      case "default-ui":
        return l10n("FIELD_PALETTE_DEFAULT_UI");
    }
  } else {
    switch (palette.id) {
      case "dmg":
        return l10n("FIELD_PALETTE_DEFAULT_DMG");
    }
  }
  // Otherwise, use the auto-generated or user specified name
  return palette.name || defaultLocalisedPaletteName(paletteIndex);
};

export const defaultLocalisedActorName = (actorIndex: number) =>
  `${l10n("ACTOR")} ${actorIndex + 1}`;
export const defaultLocalisedTriggerName = (triggerIndex: number) =>
  `${l10n("TRIGGER")} ${triggerIndex + 1}`;
export const defaultLocalisedSceneName = (sceneIndex: number) =>
  `${l10n("SCENE")} ${sceneIndex + 1}`;
export const defaultLocalisedCustomEventName = (customEventIndex: number) =>
  `${l10n("CUSTOM_EVENT")} ${customEventIndex + 1}`;
export const defaultLocalisedConstantName = (constantIndex: number) =>
  `${l10n("CONSTANT")} ${constantIndex + 1}`;
export const defaultLocalisedPaletteName = (paletteIndex: number) =>
  l10n("TOOL_PALETTE_N", { number: paletteIndex + 1 });

const extractEntitySymbols = (
  entities: EntityState<{ symbol?: string }, string>
): Set<string> => {
  return new Set(
    Object.values(entities.entities).map((entity) => entity?.symbol ?? "")
  );
};

const extractEntityStateSymbols = (state: EntitiesState): Set<string> => {
  const allSymbols = new Set<string>();

  const addSymbols = (symbols: Set<string>) => {
    symbols.forEach((symbol) => allSymbols.add(symbol));
  };

  addSymbols(extractEntitySymbols(state.scenes));
  addSymbols(extractEntitySymbols(state.actors));
  addSymbols(extractEntitySymbols(state.triggers));
  addSymbols(extractEntitySymbols(state.backgrounds));
  addSymbols(extractEntitySymbols(state.spriteSheets));
  addSymbols(extractEntitySymbols(state.emotes));
  addSymbols(extractEntitySymbols(state.tilesets));
  addSymbols(extractEntitySymbols(state.fonts));
  addSymbols(extractEntitySymbols(state.variables));
  addSymbols(extractEntitySymbols(state.constants));
  addSymbols(extractEntitySymbols(state.customEvents));
  addSymbols(extractEntitySymbols(state.music));
  addSymbols(extractEntitySymbols(state.sounds));

  return allSymbols;
};

export const genEntitySymbol = (state: EntitiesState, name: string) => {
  return genSymbol(name, extractEntityStateSymbols(state));
};

export const ensureEntitySymbolsUnique = (
  entities: EntityState<{ symbol?: string }, string>,
  seenSymbols: Set<string>
) => {
  for (const entity of Object.values(entities.entities)) {
    if (entity) {
      entity.symbol = toValidSymbol(entity.symbol ?? "");
      if (seenSymbols.has(entity.symbol)) {
        const newSymbol = genSymbol(entity.symbol, seenSymbols);
        entity.symbol = newSymbol;
      }
      seenSymbols.add(entity.symbol);
    }
  }
};

export const ensureSymbolsUnique = (state: EntitiesState) => {
  const symbols: Set<string> = new Set();
  ensureEntitySymbolsUnique(state.scenes, symbols);
  ensureEntitySymbolsUnique(state.actors, symbols);
  ensureEntitySymbolsUnique(state.triggers, symbols);
  ensureEntitySymbolsUnique(state.backgrounds, symbols);
  ensureEntitySymbolsUnique(state.spriteSheets, symbols);
  ensureEntitySymbolsUnique(state.emotes, symbols);
  ensureEntitySymbolsUnique(state.tilesets, symbols);
  ensureEntitySymbolsUnique(state.fonts, symbols);
  ensureEntitySymbolsUnique(state.variables, symbols);
  ensureEntitySymbolsUnique(state.constants, symbols);
  ensureEntitySymbolsUnique(state.customEvents, symbols);
  ensureEntitySymbolsUnique(state.music, symbols);
  ensureEntitySymbolsUnique(state.sounds, symbols);
};

export const matchAssetEntity = <
  A extends Asset & { inode: string },
  T extends Asset & { inode: string }
>(
  entity: A,
  existingEntities: T[]
) => {
  return existingEntities.find(matchAsset(entity));
};

export const mergeAssetEntity = <T extends Asset & { inode: string }>(
  entities: EntityState<T, string>,
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
  entities: EntityState<T, string>
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
  entities: EntityState<T, string>,
  adapter: EntityAdapter<T, string>,
  entity: T,
  keepProps: (keyof T)[]
) => {
  const mergedEntity = mergeAssetEntity(entities, entity, keepProps);
  const didInsert = entity === mergedEntity;
  adapter.upsertOne(entities, mergedEntity);
  return didInsert;
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
  entities: EntityState<T, string>,
  adapter: EntityAdapter<T, string>,
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

/**
 * Search entities for matching asset and name
 * @param entities entity state
 * @param adapter entity adapter
 * @param asset asset to remove
 */
export const renameAssetEntity = <
  T extends Asset & {
    id: string;
    inode: string;
    filename: string;
    name: string;
  }
>(
  entities: EntityState<T, string>,
  adapter: EntityAdapter<T, string>,
  asset: Asset,
  newFilename: string
) => {
  const existingEntities = entities.ids.map(
    (id) => entities.entities[id]
  ) as T[];
  const existingAsset = existingEntities.find(matchAsset(asset));
  if (existingAsset) {
    inodeToAssetCache[existingAsset.inode] = cloneDeep(existingAsset);
    adapter.updateOne(entities, {
      id: existingAsset.id,
      changes: {
        filename: newFilename,
        name: assetNameFromFilename(newFilename),
      } as Partial<T>,
    });
  }
};

export const updateEntitySymbol = <T extends { id: string; symbol?: string }>(
  state: EntitiesState,
  entities: EntityState<T, string>,
  adapter: EntityAdapter<T, string>,
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

export const isSlope = (value: number) => {
  return COLLISION_SLOPE_VALUES.includes(value);
};

export const updateCustomEventArgs = (
  customEvent: CustomEventNormalized,
  scriptEventLookup: Record<string, ScriptEventNormalized>,
  scriptEventDefs: ScriptEventDefs
) => {
  const variables = {} as Record<string, CustomEventVariable>;
  const actors = {} as Record<string, CustomEventActor>;
  const oldVariables = customEvent.variables;
  const oldActors = customEvent.actors;

  walkNormalizedScript(
    customEvent.script,
    scriptEventLookup,
    undefined,
    (scriptEvent) => {
      const args = scriptEvent.args;
      if (!args) return;
      Object.keys(args).forEach((arg) => {
        const addActor = (actor: string) => {
          const letter = String.fromCharCode(
            "A".charCodeAt(0) + parseInt(actor)
          );
          actors[actor] = {
            id: actor,
            name: oldActors[actor]?.name || `${l10n("FIELD_ACTOR")} ${letter}`,
          };
        };
        const addVariable = (variable: string) => {
          const letter = String.fromCharCode(
            "A".charCodeAt(0) + parseInt(variable[1])
          );
          variables[variable] = {
            id: variable,
            name: oldVariables[variable]?.name || `Variable ${letter}`,
            passByReference: oldVariables[variable]?.passByReference ?? true,
          };
        };
        const addPropertyActor = (property: string) => {
          const actor = property && property.replace(/:.*/, "");
          if (actor !== "player" && actor !== "$self$") {
            const letter = String.fromCharCode(
              "A".charCodeAt(0) + parseInt(actor)
            );
            actors[actor] = {
              id: actor,
              name: oldActors[actor]?.name || `Actor ${letter}`,
            };
          }
        };

        if (isActorField(scriptEvent.command, arg, args, scriptEventDefs)) {
          const actor = args[arg];
          if (
            actor &&
            actor !== "player" &&
            actor !== "$self$" &&
            typeof actor === "string"
          ) {
            addActor(actor);
          }
        }

        if (isVariableField(scriptEvent.command, arg, args, scriptEventDefs)) {
          const variable = args[arg];
          if (
            isUnionVariableValue(variable) &&
            variable.value &&
            isVariableCustomEvent(variable.value)
          ) {
            addVariable(variable.value);
          } else if (
            typeof variable === "string" &&
            isVariableCustomEvent(variable)
          ) {
            addVariable(variable);
          }
        }
        if (isPropertyField(scriptEvent.command, arg, args, scriptEventDefs)) {
          const property = args[arg];
          if (isUnionPropertyValue(property) && property.value) {
            addPropertyActor(property.value);
          } else if (typeof property === "string") {
            addPropertyActor(property);
          }
        }
        if (
          isScriptValueField(scriptEvent.command, arg, args, scriptEventDefs)
        ) {
          const value = isScriptValue(args[arg])
            ? (args[arg] as ScriptValue)
            : undefined;
          const actors = value ? extractScriptValueActorIds(value) : [];
          const variables = value ? extractScriptValueVariables(value) : [];
          for (const actor of actors) {
            addPropertyActor(actor);
          }
          for (const variable of variables) {
            if (isVariableCustomEvent(variable)) {
              addVariable(variable);
            }
          }
        }
      });
      if (args.text || args.expression) {
        let text;
        if (args.text) {
          text = Array.isArray(args.text) ? args.text.join() : args.text;
        } else if (args.expression) {
          text = args.expression;
        }
        if (text && typeof text === "string") {
          const variablePtrs = text.match(/\$V[0-9]\$/g);
          if (variablePtrs) {
            variablePtrs.forEach((variablePtr: string) => {
              const variable = variablePtr[2];
              const letter = String.fromCharCode(
                "A".charCodeAt(0) + parseInt(variable, 10)
              ).toUpperCase();
              const variableId = `V${variable}`;
              variables[variableId] = {
                id: variableId,
                name: oldVariables[variableId]?.name || `Variable ${letter}`,
                passByReference:
                  oldVariables[variableId]?.passByReference ?? true,
              };
            });
          }
        }
      }
    }
  );

  customEvent.variables = sortByKey(variables);
  customEvent.actors = actors;
};

export const updateAllCustomEventsArgs = (
  customEvents: CustomEventNormalized[],
  scriptEventLookup: Record<string, ScriptEventNormalized>,
  scriptEventDefs: ScriptEventDefs
) => {
  for (const customEvent of customEvents) {
    updateCustomEventArgs(customEvent, scriptEventLookup, scriptEventDefs);
  }
};

export const validScriptEvent = (scriptEvent: ScriptEvent): boolean => {
  return !!(scriptEvent && scriptEvent.id);
};

export const sceneFixNulls = (scene: Scene): Scene => {
  const newScene = { ...scene };
  walkSceneScriptsKeys((key) => {
    newScene[key] = filterEvents(newScene[key], validScriptEvent);
  });
  return newScene;
};

export const actorFixNulls = <T extends Actor | ActorPrefab>(actor: T): T => {
  const newActor = { ...actor };
  walkActorScriptsKeys((key) => {
    newActor[key] = filterEvents(newActor[key], validScriptEvent);
  });
  return newActor;
};

export const triggerFixNulls = <T extends Trigger | TriggerPrefab>(
  trigger: T
): T => {
  const newTrigger = { ...trigger };
  walkTriggerScriptsKeys((key) => {
    newTrigger[key] = filterEvents(newTrigger[key], validScriptEvent);
  });
  return newTrigger;
};

export const scriptFixNulls = (script: CustomEvent): CustomEvent => {
  return { ...script, script: filterEvents(script.script, validScriptEvent) };
};
