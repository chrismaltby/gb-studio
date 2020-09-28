import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import debounce from "lodash/debounce";
import { MAX_ACTORS, MAX_ACTORS_SMALL, MAX_FRAMES, MAX_TRIGGERS, MAX_ONSCREEN, SCREEN_WIDTH, SCREEN_HEIGHT } from "../../consts";
import {
  SceneShape,
  ActorShape,
  TriggerShape,
  SpriteShape,
} from "../../store/stateShape";
import { walkSceneEvents } from "../../lib/helpers/eventSystem";
import { EVENT_PLAYER_SET_SPRITE } from "../../lib/compiler/eventTypes";
import { sceneSelectors, actorSelectors, triggerSelectors, spriteSheetSelectors } from "../../store/features/entities/entitiesState";
import clamp from "../../lib/helpers/clamp";
import l10n from "../../lib/helpers/l10n";

class SceneInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      actorCount: 0,
      frameCount: 0,
      triggerCount: 0,
      warnings: [],
    };
    this.debouncedRecalculateCounts = debounce(this.recalculateCounts, 100);
  }

  componentDidMount() {
    this.debouncedRecalculateCounts();
  }

  componentDidUpdate(prevProps) {
    const {
      scene,
      actorsLookup,
      triggersLookup,
      spriteSheetsLookup,
    } = this.props;
    if (
      prevProps.scene !== scene ||
      prevProps.actorsLookup !== actorsLookup ||
      prevProps.triggersLookup !== triggersLookup ||
      prevProps.spriteSheetsLookup !== spriteSheetsLookup
    ) {
      this.debouncedRecalculateCounts();
    }
  }

  recalculateCounts = () => {
    const {
      scene,
      actorsLookup,
      triggersLookup,
      spriteSheetsLookup,
    } = this.props;

    const warnings = [];

    const usedSpriteSheets = [];

    const fullScene = {
      ...scene,
      actors: scene.actors.map((id) => actorsLookup[id]),
      triggers: scene.triggers.map((id) => triggersLookup[id]),
    };

    // Find used sprite sheets in events
    walkSceneEvents(fullScene, (event) => {
      if (
        event.args &&
        event.args.spriteSheetId &&
        event.command !== EVENT_PLAYER_SET_SPRITE &&
        !event.args.__comment
      ) {
        const spriteSheet = spriteSheetsLookup[event.args.spriteSheetId];
        if (usedSpriteSheets.indexOf(spriteSheet) === -1) {
          usedSpriteSheets.push(spriteSheet);
        }
      }
    });

    // Find used sprite sheets from scene actors
    fullScene.actors.forEach((actor) => {
      const spriteSheet = spriteSheetsLookup[actor.spriteSheetId];
      if (usedSpriteSheets.indexOf(spriteSheet) === -1) {
        usedSpriteSheets.push(spriteSheet);
      }
    });

    const frameCount = usedSpriteSheets.reduce((memo, spriteSheet) => {
      return memo + (spriteSheet ? spriteSheet.numFrames : 0);
    }, 0);

    function checkScreenAt(x, y) {
      let near = 0;
      for (let j = 0; j < fullScene.actors.length; j++) {
        const otherActor = fullScene.actors[j];
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

    const checkScreenCache = {};
    function cachedCheckScreenAt(checkX, checkY) {
      const x = clamp(checkX, 0, fullScene.width - SCREEN_WIDTH);
      const y = clamp(checkY, 0, fullScene.height - SCREEN_HEIGHT);   
      const key = `${x}_${y}`;
      if (checkScreenCache[key] === undefined) {
        checkScreenCache[key] = checkScreenAt(x, y);
      }
      return checkScreenCache[key];
    }

    function checkForTooCloseActors() {
      for (let i=fullScene.actors.length-1; i>0; i--) {
        const actor = fullScene.actors[i];
        for(let x=actor.x - SCREEN_WIDTH; x<actor.x + SCREEN_WIDTH; x++) {
          for(let y=actor.y - SCREEN_HEIGHT; y<actor.y + SCREEN_HEIGHT; y++) {
            const near = cachedCheckScreenAt(x, y);
            if (near > MAX_ONSCREEN) {
              const actorName = actor.name || `Actor ${i + 1}`
              warnings.push(l10n("WARNING_TOO_MANY_ONSCREEN_ACTORS", { actorName }));
              warnings.push(l10n("WARNING_ONSCREEN_ACTORS_LIMIT", { maxOnscreen: MAX_ONSCREEN }));
              return;              
            }
          }
        }
      }
    }

    checkForTooCloseActors();

    this.setState({
      loaded: true,
      actorCount: scene.actors.length,
      triggerCount: scene.triggers.length,
      frameCount,
      warnings
    });
  };

  render() {
    const { loaded, actorCount, frameCount, triggerCount, warnings } = this.state;
    const { scene } = this.props;

    if (!loaded) {
      return null;
    }

    const maxActors = (scene.width <= SCREEN_WIDTH && scene.height <= SCREEN_HEIGHT)
      ? MAX_ACTORS_SMALL
      : MAX_ACTORS;

    return (
      <>
        <span
          title={`Number of actors in scene. This scene has used ${actorCount} of ${maxActors} available.`}
          className={cx({
            "Scene__Info--Warning": actorCount === maxActors,
            "Scene__Info--Error": actorCount > maxActors,
          })}
        >
          A: {actorCount}/{maxActors}
        </span>
        {"\u00A0 \u00A0"}
        <span
          title={`Number of frames used by actors in scene. ${
            frameCount <= MAX_FRAMES
              ? `This scene has used ${frameCount} or ${MAX_FRAMES} available.`
              : `This scene is over available limits and may have rendering issues. ` +
                `Try reducing number of actors in scene or use static and non animated ` +
                `sprites where possible.`
          } Stay within limits to prevent tile data overwriting sprite data.`}
          className={cx({
            "Scene__Info--Warning": frameCount === MAX_FRAMES,
            "Scene__Info--Error": frameCount > MAX_FRAMES,
          })}
        >
          F: {frameCount}/{MAX_FRAMES}
        </span>
        {"\u00A0 \u00A0"}
        <span
          title={`Number of triggers in scene. This scene has used ${triggerCount} of ${MAX_TRIGGERS} available.`}
          className={cx({
            "Scene__Info--Warning": triggerCount === MAX_TRIGGERS,
            "Scene__Info--Error": triggerCount > MAX_TRIGGERS,
          })}
        >
          T: {triggerCount}/{MAX_TRIGGERS}
        </span>
        {warnings.length > 0 && warnings.map((warning) => <div key={warning} className="Scene__Info--Error">{warning}</div>)}
      </>
    );
  }
}

SceneInfo.propTypes = {
  scene: SceneShape.isRequired,
  actorsLookup: PropTypes.objectOf(ActorShape).isRequired,
  triggersLookup: PropTypes.objectOf(TriggerShape).isRequired,
  spriteSheetsLookup: PropTypes.objectOf(SpriteShape).isRequired,
};

function mapStateToProps(state, props) {
  const actorsLookup = actorSelectors.selectEntities(state);
  const triggersLookup = triggerSelectors.selectEntities(state);
  const spriteSheetsLookup = spriteSheetSelectors.selectEntities(state);
  const scene = sceneSelectors.selectById(state, props.id);

  return {
    scene,
    actorsLookup,
    triggersLookup,
    spriteSheetsLookup,
  };
}

export default connect(mapStateToProps)(SceneInfo);
