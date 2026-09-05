import type {
  BuildUsageSource,
  BuildUsageScript,
} from "lib/compiler/buildUsage";
import type { CompiledScriptSource } from "lib/compiler/compileData";
import {
  actorName,
  customEventName,
  sceneName,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import type { ProjectResources } from "shared/lib/resources/types";
import {
  buildAssetUsageRows,
  type BuildAssetSourceType,
  type BuildAssetType,
} from "./buildAssetUsage";

type NamedEntity = { id: string; name: string };
type SymbolEntity = NamedEntity & { symbol: string };

export type BuildUsageItemEntities = {
  scenes: Array<SymbolEntity & { actors: string[]; triggers: string[] }>;
  actors: Array<NamedEntity & { collisionGroup?: string }>;
  triggers: NamedEntity[];
  customEvents: NamedEntity[];
  sprites: SymbolEntity[];
  backgrounds: SymbolEntity[];
  music: SymbolEntity[];
  sounds: SymbolEntity[];
};

export type BuildUsageItemType = "script" | BuildAssetType;

type BuildUsageItemBase = {
  key: string;
  type: BuildUsageItemType;
  name: string;
  symbol: string;
  sourceFile: string;
  size: number;
};

export type BuildUsageScriptItem = BuildUsageItemBase & {
  type: "script";
  sources: CompiledScriptSource[];
  sourceLabels: string[];
};

export type BuildUsageAssetItem = BuildUsageItemBase & {
  type: BuildAssetType;
  sourceType: BuildAssetSourceType;
};

export type BuildUsageItem = BuildUsageScriptItem | BuildUsageAssetItem;

const scriptKeyLabel = (source: CompiledScriptSource) => {
  switch (source.scriptKey) {
    case "script":
      if (source.entityType === "scene") return l10n("SIDEBAR_ON_INIT");
      if (source.entityType === "trigger") return l10n("SIDEBAR_ON_ENTER");
      if (source.entityType === "customEvent") return l10n("FIELD_SCRIPT");
      return l10n("SIDEBAR_ON_INTERACT");
    case "startScript":
      return l10n("SIDEBAR_ON_INIT");
    case "updateScript":
      return l10n("SIDEBAR_ON_UPDATE");
    case "leaveScript":
      return l10n("SIDEBAR_ON_LEAVE");
    case "playerHit1Script":
    case "hit1Script":
      return l10n("SIDEBAR_ON_PLAYER_HIT");
    case "playerHit2Script":
    case "hit2Script":
      return l10n("FIELD_COLLISION_GROUP_N", { n: 2 });
    case "playerHit3Script":
    case "hit3Script":
      return l10n("FIELD_COLLISION_GROUP_N", { n: 3 });
    default:
      return source.scriptKey;
  }
};

const sourceFileBasename = (sourceFile: string) =>
  sourceFile.split(/[\\/]/).pop() ?? sourceFile;

export const buildUsageItems = ({
  scripts,
  sources,
  entities,
}: {
  scripts: BuildUsageScript[];
  sources: BuildUsageSource[];
  entities: BuildUsageItemEntities;
}): BuildUsageItem[] => {
  const sceneLookup = new Map(entities.scenes.map((item) => [item.id, item]));
  const actorLookup = new Map(entities.actors.map((item) => [item.id, item]));
  const triggerLookup = new Map(
    entities.triggers.map((item) => [item.id, item]),
  );
  const customEventLookup = new Map(
    entities.customEvents.map((item) => [item.id, item]),
  );

  const sourceLabel = (source: CompiledScriptSource) => {
    const label = scriptKeyLabel(source);
    if (source.entityType === "scene") {
      const entity = sceneLookup.get(source.entityId);
      return entity
        ? `${sceneName(
            entity,
            entities.scenes.findIndex((item) => item.id === source.entityId),
          )} (${label})`
        : label;
    }
    if (source.entityType === "actor") {
      const entity = actorLookup.get(source.entityId);
      const scene = sceneLookup.get(source.sceneId);
      const index = scene?.actors.indexOf(source.entityId) ?? -1;
      const sourceScriptLabel =
        source.scriptKey === "script" && entity?.collisionGroup
          ? l10n("SIDEBAR_ON_HIT")
          : label;
      return entity
        ? `${actorName(entity, Math.max(0, index))} (${sourceScriptLabel})`
        : label;
    }
    if (source.entityType === "trigger") {
      const entity = triggerLookup.get(source.entityId);
      const scene = sceneLookup.get(source.sceneId);
      const index = scene?.triggers.indexOf(source.entityId) ?? -1;
      return entity
        ? `${triggerName(entity, Math.max(0, index))} (${label})`
        : label;
    }
    const entity = customEventLookup.get(source.entityId);
    return entity
      ? `${customEventName(
          entity,
          entities.customEvents.findIndex(
            (item) => item.id === source.entityId,
          ),
        )} (${label})`
      : label;
  };

  const scriptItems: BuildUsageScriptItem[] = scripts.map(
    ({ symbol, size, sources }) => {
      const sourceLabels = sources.map(sourceLabel);
      return {
        key: `script:${symbol}`,
        type: "script",
        name: sourceLabels.join(", "),
        symbol,
        sourceFile: `${symbol}.s`,
        size,
        sources,
        sourceLabels,
      };
    },
  );

  const knownSymbols = {
    scenes: new Set(entities.scenes.map((scene) => scene.symbol)),
    sprites: new Set(entities.sprites.map((sprite) => sprite.symbol)),
    backgrounds: new Set(
      entities.backgrounds.map((background) => background.symbol),
    ),
  };
  const nameLookup = new Map<string, string>();
  for (const scene of entities.scenes)
    nameLookup.set(`scene:${scene.symbol}`, scene.name);
  for (const sprite of entities.sprites)
    nameLookup.set(`sprite:${sprite.symbol}`, sprite.name);
  for (const background of entities.backgrounds)
    nameLookup.set(`background:${background.symbol}`, background.name);
  for (const track of entities.music)
    nameLookup.set(`music:${track.symbol}`, track.name);
  for (const sound of entities.sounds)
    nameLookup.set(`sound:${sound.symbol}`, sound.name);

  const assetItems: BuildUsageAssetItem[] = buildAssetUsageRows(
    sources,
    knownSymbols,
  ).map((asset) => ({
    key: `${asset.type}:${asset.symbol}:${asset.sourceFile}`,
    type: asset.type,
    name: nameLookup.get(`${asset.type}:${asset.symbol}`) ?? asset.symbol,
    symbol: asset.symbol,
    sourceType: asset.sourceType,
    sourceFile: sourceFileBasename(asset.sourceFile),
    size: asset.rom,
  }));

  return [...scriptItems, ...assetItems];
};

export const buildUsageItemEntitiesFromProject = (
  project: ProjectResources,
): BuildUsageItemEntities => ({
  scenes: project.scenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    symbol: scene.symbol,
    actors: scene.actors.map((actor) => actor.id),
    triggers: scene.triggers.map((trigger) => trigger.id),
  })),
  actors: project.scenes.flatMap((scene) => scene.actors),
  triggers: project.scenes.flatMap((scene) => scene.triggers),
  customEvents: project.scripts,
  sprites: project.sprites,
  backgrounds: project.backgrounds,
  music: project.music,
  sounds: project.sounds,
});
