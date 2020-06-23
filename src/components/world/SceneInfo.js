import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import debounce from "lodash/debounce";
import { MAX_ACTORS, MAX_FRAMES, MAX_TRIGGERS } from "../../consts";
import {
  getScenesLookup,
  getActorsLookup,
  getTriggersLookup,
  getSpriteSheetsLookup,
} from "../../reducers/entitiesReducer";
import {
  SceneShape,
  ActorShape,
  TriggerShape,
  SpriteShape,
} from "../../reducers/stateShape";
import { walkSceneEvents } from "../../lib/helpers/eventSystem";
import { EVENT_PLAYER_SET_SPRITE } from "../../lib/compiler/eventTypes";

class SceneInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      actorCount: 0,
      frameCount: 0,
      triggerCount: 0,
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
          console.log(event);
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

    this.setState({
      loaded: true,
      actorCount: scene.actors.length,
      triggerCount: scene.triggers.length,
      frameCount,
    });
  };

  render() {
    const { loaded, actorCount, frameCount, triggerCount } = this.state;

    if (!loaded) {
      return null;
    }

    return (
      <>
        <span
          title={`Number of actors in scene. This scene has used ${actorCount} of ${MAX_ACTORS} available.`}
          className={cx({
            "Scene__Info--Warning": actorCount === MAX_ACTORS,
            "Scene__Info--Error": actorCount > MAX_ACTORS,
          })}
        >
          A: {actorCount}/{MAX_ACTORS}
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
  const scenesLookup = getScenesLookup(state);
  const actorsLookup = getActorsLookup(state);
  const triggersLookup = getTriggersLookup(state);
  const spriteSheetsLookup = getSpriteSheetsLookup(state);
  const scene = scenesLookup[props.id];

  return {
    scene,
    actorsLookup,
    triggersLookup,
    spriteSheetsLookup,
  };
}

export default connect(mapStateToProps)(SceneInfo);
