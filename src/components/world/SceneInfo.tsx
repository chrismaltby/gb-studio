import React, { MouseEventHandler, MouseEvent } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import cx from "classnames";
import debounce from "lodash/debounce";
import {
  MAX_ACTORS,
  MAX_ACTORS_SMALL,
  MAX_SPRITE_TILES,
  MAX_TRIGGERS,
  MAX_ONSCREEN,
  SCREEN_WIDTH,
  SCREEN_HEIGHT
} from "../../consts";
import { walkSceneEvents } from "lib/helpers/eventSystem";
import { EVENT_PLAYER_SET_SPRITE } from "lib/compiler/eventTypes";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  spriteSheetSelectors
} from "store/features/entities/entitiesState";
import clamp from "lib/helpers/clamp";
import l10n from "lib/helpers/l10n";
import { RootState } from "store/configureStore";
import { ScriptEvent, SpriteSheet } from "store/features/entities/entitiesTypes";

function useIsMounted() {
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  return () => isMountedRef.current;
}

/**
 * Originally a StackOverflow answer, selected for its use of useRef to avoid
 * re-rendering and proper debounce assignment, as opposed to re-assigning
 * the debounce using a useMemo, which would debounce improperly
 *
 * @see https://stackoverflow.com/a/62017005/4148154
 *
 * One change since then: Strict TS typings
 */
function useDebounce<T extends (...args: Array<any>) => any>(cb: T, delay: number) {
  const inputsRef = React.useRef({ cb, delay });
  const isMounted = useIsMounted();
  React.useEffect(() => {
    inputsRef.current = { cb, delay };
  });
  return React.useCallback(
    debounce((...args: Parameters<T>) => {
        // Debounce is an async callback. Cancel it, if in the meanwhile
        // (1) component has been unmounted (see isMounted in snippet)
        // (2) delay has changed
        if (inputsRef.current.delay === delay && isMounted())
          inputsRef.current.cb(...args);
      },
      delay
    ),
    [delay, debounce]
  );
}

const Portal: React.FC = (props) => {
  const root = document.getElementById("MenuPortal");
  if (!root) return;
  return ReactDOM.createPortal(props.children, root);
};

interface SceneInfoProps {
  id: string;
}

const SceneInfo = ({
                     id
                   }: SceneInfoProps) => {
  const actorsLookup = useSelector((state: RootState) =>
    actorSelectors.selectEntities(state)
  );

  const triggersLookup = useSelector((state: RootState) =>
    triggerSelectors.selectEntities(state)
  );

  const spriteSheetsLookup = useSelector((state: RootState) =>
    spriteSheetSelectors.selectEntities(state)
  );

  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, id)
  );

  const { defaultPlayerSprites } = useSelector((state: RootState) =>
    state.project.present.settings
  );

  const [sceneData, setSceneData] = React.useState({
    loaded: false,
    actorCount: 0,
    tileCount: 0,
    triggerCount: 0,
    warnings: [] as string[]
  });

  const [tooltip, setTooltip] = React.useState({
    x: 100,
    y: 100,
    type: ""
  });

  const {
    loaded,
    actorCount,
    tileCount,
    triggerCount,
    warnings
  } = sceneData;

  const tooltipTimer = React.useRef<number>();

  React.useEffect(() => {
    clearTimeout(tooltipTimer.current);
  }, []);

  const recalculateCounts = React.useCallback(() => {
    if (!scene) return;
    const warnings: string[] = [];

    const usedSpriteSheets: SpriteSheet[] = [];

    const fullScene = {
      ...scene,
      actors: scene.actors.map((id) => actorsLookup[id]),
      triggers: scene.triggers.map((id) => triggersLookup[id])
    };

    const addSprite = (id: string, force = false) => {
      const spriteSheet = spriteSheetsLookup[id];
      if (
        spriteSheet &&
        (force || usedSpriteSheets.indexOf(spriteSheet) === -1)
      ) {
        usedSpriteSheets.push(spriteSheet);
      }
    };

    // Find used sprite sheets in events
    walkSceneEvents(fullScene, (event: ScriptEvent) => {
      if (
        event.args &&
        event.args.spriteSheetId &&
        event.command !== EVENT_PLAYER_SET_SPRITE &&
        !event.args.__comment
      ) {
        addSprite(event.args.spriteSheetId as string);
      }
    });

    // Find used sprite sheets from scene actors
    fullScene.actors.forEach((actor) => {
      if (!actor) return;
      addSprite(actor.spriteSheetId);
    });

    // Add player
    if (scene.playerSpriteSheetId) {
      addSprite(scene.playerSpriteSheetId, true);
    } else {
      addSprite(defaultPlayerSprites[scene.type || "TOPDOWN"], true);
    }

    const tileCount = usedSpriteSheets.reduce((memo, spriteSheet) => {
      return (
        memo + (spriteSheet && spriteSheet.numTiles ? spriteSheet.numTiles : 0)
      );
    }, 0);

    function checkScreenAt(x: number, y: number) {
      let near = 0;
      for (let j = 0; j < fullScene.actors.length; j++) {
        const otherActor = fullScene.actors[j];
        if (!otherActor) return near;
        if (
          otherActor.x >= x - 1 &&
          otherActor.x <= x + 2 + SCREEN_WIDTH &&
          otherActor.y >= y &&
          otherActor.y <= y + SCREEN_HEIGHT
        ) {
          near++;
        }
      }
      return near;
    }

    const checkScreenCache: Record<string, number> = {};

    function cachedCheckScreenAt(checkX: number, checkY: number) {
      const x = clamp(checkX, 0, fullScene.width - SCREEN_WIDTH);
      const y = clamp(checkY, 0, fullScene.height - SCREEN_HEIGHT);
      const key = `${x}_${y}`;
      if (checkScreenCache[key] === undefined) {
        checkScreenCache[key] = checkScreenAt(x, y);
      }
      return checkScreenCache[key];
    }

    function checkForTooCloseActors() {
      for (let i = fullScene.actors.length - 1; i > 0; i--) {
        const actor = fullScene.actors[i];
        if (!actor) return;
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
              const actorName = actor.name || `Actor ${i + 1}`;
              warnings.push(
                l10n("WARNING_TOO_MANY_ONSCREEN_ACTORS", { actorName })
              );
              warnings.push(
                l10n("WARNING_ONSCREEN_ACTORS_LIMIT", {
                  maxOnscreen: MAX_ONSCREEN
                })
              );
              return;
            }
          }
        }
      }
    }

    checkForTooCloseActors();

    const maxActors =
      scene.width <= SCREEN_WIDTH && scene.height <= SCREEN_HEIGHT
        ? MAX_ACTORS_SMALL
        : MAX_ACTORS;

    if (scene.actors.length > maxActors) {
      warnings.push(l10n("WARNING_ACTORS_LIMIT"));
    }

    setSceneData({
      loaded: true,
      actorCount: scene.actors.length,
      triggerCount: scene.triggers.length,
      tileCount,
      warnings
    });
  }, [actorsLookup, defaultPlayerSprites, scene, spriteSheetsLookup, triggersLookup]);

  /**
   * Because of the implementation of "useDebounce",
   * even when `recalculateCounts` changes, it will not change
   * this function's reference. Because of this, we can safely
   * use in dep arrays (like `useEffect`'s) w/o having to worry about multi-exec
   */
  const debouncedRecalculateCounts = useDebounce(recalculateCounts, 100);

  React.useEffect(() => {
    debouncedRecalculateCounts();
  }, [
    debouncedRecalculateCounts,
    scene,
    actorsLookup,
    triggersLookup,
    spriteSheetsLookup,
    defaultPlayerSprites
  ]);

  const openTooltip = React.useCallback((type: string, e: MouseEvent<HTMLElement>, delay: number) => {
    clearTimeout(tooltipTimer.current);
    if (!e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltip = document.getElementById(`scene_info_${type}`);
    if (!tooltip) return;
    tooltip.style.display = "block";
    const tooltipHeight = tooltip.clientHeight;
    tooltip.style.removeProperty("display");
    tooltipTimer.current = setTimeout(() => {
      setTooltip({
        type,
        x: Math.max(50, rect.left),
        y: Math.min(
          window.innerHeight - tooltipHeight - 50,
          window.innerHeight - rect.top + 5
        )
      });
    }, delay);
  }, []);


  const onHoverOn = (type: string) => (e: MouseEvent<HTMLElement>) => {
    openTooltip(type, e, 500);
  };

  const onOpenTooltip = (type: string) => (e: MouseEvent<HTMLElement>) => {
    openTooltip(type, e, 0);
  };

  const onHoverOff: MouseEventHandler = (_e) => {
    clearTimeout(tooltipTimer.current);
    setTooltip({
      ...tooltip,
      type: ""
    });
  };

  if (!loaded || !scene) {
    return null;
  }

  const maxActors =
    scene.width <= SCREEN_WIDTH && scene.height <= SCREEN_HEIGHT
      ? MAX_ACTORS_SMALL
      : MAX_ACTORS;

  const actorWarning = warnings.length > 0;
  const actorError = actorCount > maxActors;

  return (
    <>
        <span
          className={cx("Scene__InfoButton", {
            "Scene__Info--Warning": actorWarning,
            "Scene__Info--Error": actorError
          })}
          onMouseEnter={onHoverOn("actors")}
          onMouseDown={onOpenTooltip("actors")}
          onMouseLeave={onHoverOff}
          aria-describedby="scene_info_actors"
        >
          A: {actorCount}/{maxActors}
          <Portal>
            <div
              id="scene_info_actors"
              role="tooltip"
              className={cx("Scene__Tooltip", {
                "Scene__Tooltip--Visible": tooltip.type === "actors"
              })}
              style={{
                left: tooltip.x,
                bottom: tooltip.y
              }}
            >
              <div>{l10n("FIELD_NUM_ACTORS_LABEL")}</div>
              <div>{l10n("FIELD_ACTORS_COUNT", { actorCount, maxActors })}</div>
              {warnings.length > 0 && (
                <div className="Scene__TooltipTitle">
                  {l10n("FIELD_WARNING")}
                </div>
              )}
              {warnings.length > 0 &&
              warnings.map((warning) => (
                <div key={warning} className="Scene__Info--Error">
                  {warning}
                </div>
              ))}
            </div>
          </Portal>
        </span>

      {"\u00A0 \u00A0"}
      <span
        className={cx("Scene__InfoButton", {
          "Scene__Info--Warning": tileCount === MAX_SPRITE_TILES,
          "Scene__Info--Error": tileCount > MAX_SPRITE_TILES
        })}
        onMouseEnter={onHoverOn("frames")}
        onClick={onOpenTooltip("frames")}
        onMouseLeave={onHoverOff}
        aria-describedby="scene_info_frames"
      >
          S: {tileCount}/{MAX_SPRITE_TILES}
        </span>
      <Portal>
        <div
          id="scene_info_frames"
          role="tooltip"
          className={cx("Scene__Tooltip", {
            "Scene__Tooltip--Visible": tooltip.type === "frames"
          })}
          style={{
            left: tooltip.x,
            bottom: tooltip.y
          }}
        >
          <div>{l10n("FIELD_NUM_SPRITE_TILES_LABEL")}</div>
          <div>
            {l10n("FIELD_SPRITE_TILES_COUNT", {
              tileCount,
              maxTiles: MAX_SPRITE_TILES
            })}
          </div>
          {tileCount > MAX_SPRITE_TILES && (
            <div className="Scene__TooltipTitle">{l10n("FIELD_WARNING")}</div>
          )}
          {tileCount > MAX_SPRITE_TILES && (
            <div>{l10n("WARNING_SPRITE_TILES_LIMIT")}</div>
          )}
        </div>
      </Portal>
      {"\u00A0 \u00A0"}
      <span
        className={cx("Scene__InfoButton", {
          "Scene__Info--Warning": triggerCount === MAX_TRIGGERS,
          "Scene__Info--Error": triggerCount > MAX_TRIGGERS
        })}
        onMouseEnter={onHoverOn("triggers")}
        onClick={onOpenTooltip("triggers")}
        onMouseLeave={onHoverOff}
        aria-describedby="scene_info_triggers"
      >
          T: {triggerCount}/{MAX_TRIGGERS}
        </span>
      <Portal>
        <div
          id="scene_info_triggers"
          role="tooltip"
          className={cx("Scene__Tooltip", {
            "Scene__Tooltip--Visible": tooltip.type === "triggers"
          })}
          style={{
            left: tooltip.x,
            bottom: tooltip.y
          }}
        >
          <div>{l10n("FIELD_NUM_TRIGGERS_LABEL")}</div>
          <div>
            {l10n("FIELD_TRIGGERS_COUNT", {
              triggerCount,
              maxTriggers: MAX_TRIGGERS
            })}
          </div>
          {triggerCount > MAX_TRIGGERS && (
            <div className="Scene__TooltipTitle">{l10n("FIELD_WARNING")}</div>
          )}
          {triggerCount > MAX_TRIGGERS && (
            <div>{l10n("WARNING_TRIGGERS_LIMIT")}</div>
          )}
        </div>
      </Portal>
    </>
  );
};

export default SceneInfo;
