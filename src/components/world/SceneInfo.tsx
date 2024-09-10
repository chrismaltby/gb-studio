import {
  EVENT_ACTOR_SET_SPRITE,
  EVENT_PLAYER_SET_SPRITE,
  MAX_ACTORS,
  MAX_ACTORS_SMALL,
  MAX_NESTED_SCRIPT_DEPTH,
  MAX_ONSCREEN,
  MAX_TRIGGERS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "consts";
import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  spriteSheetSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import styled, { css } from "styled-components";
import { TooltipWrapper } from "ui/tooltips/Tooltip";
import l10n from "shared/lib/lang/l10n";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import { SpriteSheetNormalized } from "shared/lib/entities/entitiesTypes";
import clamp from "shared/lib/helpers/clamp";
import { useDebounce } from "ui/hooks/use-debounce";
import { maxSpriteTilesForBackgroundTilesLength } from "shared/lib/helpers/sprites";
import { walkNormalizedSceneScripts } from "shared/lib/scripts/walk";

interface SceneInfoWrapperProps {
  loaded: boolean;
}

interface SceneInfoButtonProps {
  warning?: boolean;
  error?: boolean;
}

const MAX_LOGO_SPRITE_TILES = 12;

const SceneInfoWrapper = styled.div<SceneInfoWrapperProps>`
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: opacity linear 0.2s;
  line-height: 12px;
  padding: 5px 0 2px;
  font-size: 10px;

  ${(props) =>
    props.loaded
      ? css`
          opacity: 1;
        `
      : ""}
`;

const SceneInfoButton = styled.div<SceneInfoButtonProps>`
  position: relative;
  border-radius: 4px;
  padding: 2px;
  margin: 0 3px;
  white-space: nowrap;

  :hover {
    background-color: rgba(128, 128, 128, 0.2);
  }

  ${(props) =>
    props.warning
      ? css`
          background: rgb(243, 168, 30);
          color: #fff;
          :hover {
            background: rgb(243, 168, 30);
            opacity: 0.7;
          }
        `
      : ""}

  ${(props) =>
    props.error
      ? css`
          background: rgb(243, 0, 0);
          color: #fff;
          :hover {
            background: rgb(243, 0, 0);
            opacity: 0.7;
          }
        `
      : ""}
`;

const SceneInfo = () => {
  const selectedSceneId = useAppSelector((state) => state.editor.scene);
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, selectedSceneId)
  );
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state)
  );
  const spriteSheetsLookup = useAppSelector((state) =>
    spriteSheetSelectors.selectEntities(state)
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state)
  );
  const customEventsLookup = useAppSelector((state) =>
    customEventSelectors.selectEntities(state)
  );
  const defaultPlayerSprites = useAppSelector(
    (state) => state.project.present.settings.defaultPlayerSprites
  );
  const backgroundNumTiles = useAppSelector(
    (state) => state.assets.backgrounds[scene?.backgroundId || ""]?.numTiles
  );
  const backgroundAllocationStrat = useAppSelector(
    (state) => state.assets.backgrounds[scene?.backgroundId || ""]?.allocationStrat
  );
  const isCGBOnly = useAppSelector(
    (state) => state.project.present.settings.colorMode === "color"
  );
  const [tileCount, setTileCount] = useState(0);
  const [actorWarnings, setActorWarnings] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const recalculateCounts = useCallback(() => {
    if (!scene) {
      return;
    }
    const newActorWarnings: string[] = [];
    const usedSpriteSheets: SpriteSheetNormalized[] = [];

    const addSprite = (id: string, force = false) => {
      const spriteSheet = spriteSheetsLookup[id];
      if (
        spriteSheet &&
        (force || usedSpriteSheets.indexOf(spriteSheet) === -1)
      ) {
        usedSpriteSheets.push(spriteSheet);
      }
    };

    if (scene) {
      const actorsExclusiveLookup: Record<string, SpriteSheetNormalized> = {};

      // Events
      walkNormalizedSceneScripts(
        scene,
        scriptEventsLookup,
        actorsLookup,
        triggersLookup,
        actorPrefabsLookup,
        triggerPrefabsLookup,
        {
          customEvents: {
            lookup: customEventsLookup,
            maxDepth: MAX_NESTED_SCRIPT_DEPTH,
          },
        },
        (scriptEvent, actor, _trigger) => {
          // Skip commented events
          if (scriptEvent.args?.__comment) {
            return;
          }
          // Add projectiles etc.
          if (
            scriptEvent.command !== EVENT_ACTOR_SET_SPRITE &&
            scriptEvent.command !== EVENT_PLAYER_SET_SPRITE &&
            scriptEvent.args?.spriteSheetId
          ) {
            addSprite(String(scriptEvent.args.spriteSheetId || ""));
          }

          // For EVENT_ACTOR_SET_SPRITE build lookup table of exclusive actors
          // storing max sized sprite used for actor
          if (
            scriptEvent.args &&
            scriptEvent.args.spriteSheetId &&
            scriptEvent.command === EVENT_ACTOR_SET_SPRITE
          ) {
            let actorId = String(scriptEvent.args.actorId);
            if (actorId === "$self$") {
              if (actor) {
                actorId = actor.id;
              } else {
                actorId = "player";
              }
            }
            const sprite =
              spriteSheetsLookup[String(scriptEvent.args.spriteSheetId) || ""];

            if (sprite) {
              if (!actorsExclusiveLookup[actorId]) {
                actorsExclusiveLookup[actorId] = sprite;
              } else if (
                actorsExclusiveLookup[actorId].numTiles < sprite.numTiles
              ) {
                actorsExclusiveLookup[actorId] = sprite;
              }
            }
          }

          // For EVENT_PLAYER_SET_SPRITE build lookup table
          // storing max sized sprite used for player
          if (
            scriptEvent.args &&
            scriptEvent.args.spriteSheetId &&
            scriptEvent.command === EVENT_PLAYER_SET_SPRITE
          ) {
            const actorId = "player";
            const sprite =
              spriteSheetsLookup[String(scriptEvent.args.spriteSheetId) || ""];
            if (sprite) {
              if (!actorsExclusiveLookup[actorId]) {
                actorsExclusiveLookup[actorId] = sprite;
              } else if (
                actorsExclusiveLookup[actorId].numTiles < sprite.numTiles
              ) {
                actorsExclusiveLookup[actorId] = sprite;
              }
            }
          }
        }
      );

      // Actor sprites - Non exclusive
      scene.actors.forEach((actorId) => {
        const actor = actorsLookup[actorId];
        if (actor && !actorsExclusiveLookup[actorId]) {
          const prefab = actorPrefabsLookup[actor.prefabId];
          addSprite(prefab?.spriteSheetId ?? actor.spriteSheetId);
        }
      });

      // Add Exclusive Actor sprites
      scene.actors.forEach((actorId) => {
        const actor = actorsLookup[actorId];
        if (actor && actorsExclusiveLookup[actorId]) {
          const prefab = actorPrefabsLookup[actor.prefabId];
          const defaultSprite =
            spriteSheetsLookup[
              prefab?.spriteSheetId ?? actor.spriteSheetId ?? ""
            ];
          if (
            !defaultSprite ||
            actorsExclusiveLookup[actorId].numTiles > defaultSprite.numTiles
          ) {
            addSprite(actorsExclusiveLookup[actorId].id, true);
          } else {
            addSprite(prefab?.spriteSheetId ?? actor.spriteSheetId, true);
          }
        }
      });

      // Player sprite
      if (scene.type !== "LOGO") {
        let playerSpriteId = scene.playerSpriteSheetId || "";
        if (!scene.playerSpriteSheetId) {
          playerSpriteId = defaultPlayerSprites[scene.type || "TOPDOWN"];
        }
        const defaultPlayerSprite = spriteSheetsLookup[playerSpriteId || ""];
        // Check if any player exclusive sprite have more tiles than default
        if (
          defaultPlayerSprite &&
          actorsExclusiveLookup["player"] &&
          actorsExclusiveLookup["player"].numTiles >
            defaultPlayerSprite.numTiles
        ) {
          playerSpriteId = actorsExclusiveLookup["player"].id;
        }
        addSprite(playerSpriteId, true);
      }

      const tileCount = usedSpriteSheets.reduce((memo, spriteSheet) => {
        let numTiles =
          spriteSheet && spriteSheet.numTiles ? spriteSheet.numTiles : 0;
        if (isCGBOnly) {
          // CGB Only splits tiles equally between VRAM banks 1 + 2
          // need to take into account that odd number of tiles will fill
          // VRAM bank1 quicker
          numTiles = Math.ceil(numTiles * 0.5) * 2;
        }
        return memo + numTiles;
      }, 0);

      setTileCount(tileCount);
    }

    const checkScreenAt = (x: number, y: number) => {
      let near = 0;
      if (scene) {
        for (let j = 0; j < scene.actors.length; j++) {
          const otherActorId = scene.actors[j];
          const otherActor = actorsLookup[otherActorId];
          if (
            otherActor &&
            otherActor.x >= x - 1 &&
            otherActor.x <= x + 2 + SCREEN_WIDTH &&
            otherActor.y >= y &&
            otherActor.y <= y + SCREEN_HEIGHT
          ) {
            near++;
          }
        }
      }
      return near;
    };

    const checkScreenCache: Record<string, number> = {};
    const cachedCheckScreenAt = (checkX: number, checkY: number) => {
      if (scene) {
        const x = clamp(checkX, 0, scene.width - SCREEN_WIDTH);
        const y = clamp(checkY, 0, scene.height - SCREEN_HEIGHT);
        const key = `${x}_${y}`;
        if (checkScreenCache[key] === undefined) {
          checkScreenCache[key] = checkScreenAt(x, y);
        }
        return checkScreenCache[key];
      }
      return 0;
    };

    function checkForTooCloseActors() {
      if (scene) {
        for (let i = scene.actors.length - 1; i > 0; i--) {
          const actorId = scene.actors[i];
          const actor = actorsLookup[actorId];
          if (!actor) {
            continue;
          }
          const actorX = clamp(actor.x, 0, 255);
          const actorY = clamp(actor.y, 0, 255);
          for (let x = actorX - SCREEN_WIDTH; x < actorX + SCREEN_WIDTH; x++) {
            for (
              let y = actorY - SCREEN_HEIGHT;
              y < actorY + SCREEN_HEIGHT;
              y++
            ) {
              const near = cachedCheckScreenAt(x, y);
              if (near > MAX_ONSCREEN) {
                const name = actorName(actor, i);
                console.log("TOO CLOSE");
                newActorWarnings.push(
                  l10n("WARNING_TOO_MANY_ONSCREEN_ACTORS", { actorName: name })
                );
                newActorWarnings.push(
                  l10n("WARNING_ONSCREEN_ACTORS_LIMIT", {
                    maxOnscreen: MAX_ONSCREEN,
                  })
                );
                return;
              }
            }
          }
        }
      }
    }

    checkForTooCloseActors();
    setActorWarnings(newActorWarnings);
    setLoaded(true);
  }, [
    scene,
    spriteSheetsLookup,
    scriptEventsLookup,
    actorsLookup,
    triggersLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
    customEventsLookup,
    defaultPlayerSprites,
    isCGBOnly,
  ]);

  const debouncedRecalculateCounts = useDebounce(recalculateCounts, 200);

  useEffect(() => {
    debouncedRecalculateCounts();
  }, [
    debouncedRecalculateCounts,
    scene,
    actorsLookup,
    triggersLookup,
    scriptEventsLookup,
    spriteSheetsLookup,
    defaultPlayerSprites,
    actorPrefabsLookup,
  ]);

  if (!scene) {
    return <></>;
  }

  let maxActors = MAX_ACTORS;
  let maxTriggers = MAX_TRIGGERS;

  if (scene.type === "LOGO") {
    maxTriggers = 0;
  } else if (scene.width <= SCREEN_WIDTH && scene.height <= SCREEN_HEIGHT) {
    maxActors = MAX_ACTORS_SMALL;
  }

  const actorCount = scene.actors.length;
  const actorWarning = actorWarnings.length > 0 || actorCount === maxActors;
  const actorError = actorCount > maxActors;
  const triggerCount = scene.triggers.length;
  const maxSpriteTiles =
    scene.type !== "LOGO"
      ? maxSpriteTilesForBackgroundTilesLength(backgroundNumTiles, isCGBOnly, backgroundAllocationStrat)
      : MAX_LOGO_SPRITE_TILES;

  return (
    <SceneInfoWrapper loaded={loaded}>
      <TooltipWrapper
        tooltip={
          <>
            <div>{l10n("FIELD_NUM_ACTORS_LABEL")}</div>
            <div>
              {l10n("FIELD_ACTORS_COUNT", {
                actorCount: String(actorCount),
                maxActors: String(maxActors),
              })}
            </div>
            {actorWarnings.length > 0 && <div>{l10n("FIELD_WARNING")}</div>}
            {actorWarnings.length > 0 &&
              actorWarnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
          </>
        }
      >
        <SceneInfoButton warning={actorWarning} error={actorError}>
          A: {actorCount}/{maxActors}
        </SceneInfoButton>
      </TooltipWrapper>

      <TooltipWrapper
        tooltip={
          <>
            <div>{l10n("FIELD_NUM_SPRITE_TILES_LABEL")}</div>
            <div>
              {l10n("FIELD_SPRITE_TILES_COUNT", {
                tileCount: String(tileCount),
                maxTiles: String(maxSpriteTiles),
              })}
            </div>
            {tileCount > maxSpriteTiles && <div>{l10n("FIELD_WARNING")}</div>}
            {tileCount > maxSpriteTiles && (
              <div>{l10n("WARNING_SPRITE_TILES_LIMIT")}</div>
            )}
          </>
        }
      >
        <SceneInfoButton
          warning={tileCount === maxSpriteTiles}
          error={tileCount > maxSpriteTiles}
        >
          S: {tileCount}/{maxSpriteTiles}
        </SceneInfoButton>
      </TooltipWrapper>

      <TooltipWrapper
        tooltip={
          <>
            <div>{l10n("FIELD_NUM_TRIGGERS_LABEL")}</div>
            <div>
              {l10n("FIELD_TRIGGERS_COUNT", {
                triggerCount: String(triggerCount),
                maxTriggers: String(maxTriggers),
              })}
            </div>
            {triggerCount > maxTriggers && <div>{l10n("FIELD_WARNING")}</div>}
            {triggerCount > maxTriggers && (
              <div>{l10n("WARNING_TRIGGERS_LIMIT")}</div>
            )}
            {scene.type === "LOGO" && (
              <div>{l10n("WARNING_LOGO_ENTITIES")}</div>
            )}
          </>
        }
      >
        <SceneInfoButton
          warning={maxTriggers > 0 && triggerCount === maxTriggers}
          error={triggerCount > maxTriggers}
        >
          T: {triggerCount}/{maxTriggers}
        </SceneInfoButton>
      </TooltipWrapper>
    </SceneInfoWrapper>
  );
};

export default SceneInfo;
