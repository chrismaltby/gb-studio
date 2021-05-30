import React, { Component } from "react";
import ReactDOM from "react-dom";
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

const Portal = (props) => {
  const root = document.getElementById("MenuPortal");
  return ReactDOM.createPortal(props.children, root);
}

class SceneInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      actorCount: 0,
      frameCount: 0,
      triggerCount: 0,
      warnings: [],
      tooltipType: "",
      tooltipX: 100,
      tooltipY: 100
    };
    this.tooltipTimer = null;
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

  componentWillUnmount() {
    clearTimeout(this.tooltipTimer);
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
        const actorX = clamp(actor.x, 0, 255);
        const actorY = clamp(actor.y, 0, 255);
        for(let x=actorX - SCREEN_WIDTH; x<actorX + SCREEN_WIDTH; x++) {
          for(let y=actorY - SCREEN_HEIGHT; y<actorY + SCREEN_HEIGHT; y++) {
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

    const maxActors = (scene.width <= SCREEN_WIDTH && scene.height <= SCREEN_HEIGHT)
      ? MAX_ACTORS_SMALL
      : MAX_ACTORS;

    if (scene.actors.length > maxActors) {
      warnings.push(l10n("WARNING_ACTORS_LIMIT"));
    }

    this.setState({
      loaded: true,
      actorCount: scene.actors.length,
      triggerCount: scene.triggers.length,
      frameCount,
      warnings
    });
  };

  onHoverOn = (type) => (e) => {
    this.openTooltip(type, e, 500);
  }

  onOpenTooltip = (type) => (e) => {
    this.openTooltip(type, e, 0);
  }  

  openTooltip = (type, e, delay) => {
    clearTimeout(this.tooltipTimer);
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltip = document.getElementById(`scene_info_${type}`);
    tooltip.style.display = "block";
    const tooltipHeight = tooltip.clientHeight;
    tooltip.style.removeProperty("display");    
    this.tooltipTimer = setTimeout(() => {
      this.setState({
        tooltipType: type,
        tooltipX: Math.max(50, rect.left),
        tooltipY: Math.min(window.innerHeight - tooltipHeight - 50, window.innerHeight - rect.top + 5)
      })
    }, delay);
  }

  onHoverOff = (e) => {
    clearTimeout(this.tooltipTimer);
    this.setState({
      tooltipType: "",
    })    
  }

  render() {
    const { loaded, actorCount, frameCount, triggerCount, warnings, tooltipType, tooltipX, tooltipY } = this.state;
    const { scene } = this.props;

    if (!loaded) {
      return null;
    }

    const maxActors = (scene.width <= SCREEN_WIDTH && scene.height <= SCREEN_HEIGHT)
      ? MAX_ACTORS_SMALL
      : MAX_ACTORS;

    const actorWarning = warnings.length > 0;
    const actorError = actorCount > maxActors;

    return (
      <>
        <span
          className={cx("Scene__InfoButton", {
            "Scene__Info--Warning": actorWarning,
            "Scene__Info--Error": actorError,
          })}
          onMouseEnter={this.onHoverOn("actors")}
          onMouseDown={this.onOpenTooltip("actors")}
          onMouseLeave={this.onHoverOff}
          aria-describedby="scene_info_actors"
        >
          A: {actorCount}/{maxActors}
          <Portal>
            <div
              id="scene_info_actors"
              role="tooltip"
              className={cx("Scene__Tooltip", {
                "Scene__Tooltip--Visible": tooltipType === "actors",
              })}
              style={{
                left: tooltipX,
                bottom: tooltipY,
              }}
            >
              <div>{l10n("FIELD_NUM_ACTORS_LABEL")}</div>
              <div>{l10n("FIELD_ACTORS_COUNT", { actorCount, maxActors })}</div>
              {warnings.length > 0 && <div className="Scene__TooltipTitle">{l10n("FIELD_WARNING")}</div>}
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
            "Scene__Info--Warning": frameCount === MAX_FRAMES,
            "Scene__Info--Error": frameCount > MAX_FRAMES,
          })}
          onMouseEnter={this.onHoverOn("frames")}
          onClick={this.onOpenTooltip("frames")}
          onMouseLeave={this.onHoverOff}
          aria-describedby="scene_info_frames"
        >
          F: {frameCount}/{MAX_FRAMES}
        </span>
        <Portal>
          <div
            id="scene_info_frames"
            role="tooltip"
            className={cx("Scene__Tooltip", {
              "Scene__Tooltip--Visible": tooltipType === "frames",
            })}
            style={{
              left: tooltipX,
              bottom: tooltipY,
            }}
          >
            <div>{l10n("FIELD_NUM_FRAMES_LABEL")}</div>
            <div>{l10n("FIELD_FRAMES_COUNT", {frameCount, maxFrames: MAX_FRAMES})}</div>
            {frameCount > MAX_FRAMES && <div className="Scene__TooltipTitle">{l10n("FIELD_WARNING")}</div>}
            {frameCount > MAX_FRAMES && <div>{l10n("WARNING_FRAMES_LIMIT")}</div>}
          </div>
        </Portal>
        {"\u00A0 \u00A0"}
        <span
          className={cx("Scene__InfoButton", {
            "Scene__Info--Warning": triggerCount === MAX_TRIGGERS,
            "Scene__Info--Error": triggerCount > MAX_TRIGGERS,
          })}
          onMouseEnter={this.onHoverOn("triggers")}
          onClick={this.onOpenTooltip("triggers")}
          onMouseLeave={this.onHoverOff}          
          aria-describedby="scene_info_triggers"
        >
          T: {triggerCount}/{MAX_TRIGGERS}
        </span>
        <Portal>
          <div
            id="scene_info_triggers"
            role="tooltip"
            className={cx("Scene__Tooltip", {
              "Scene__Tooltip--Visible": tooltipType === "triggers",
            })}
            style={{
              left: tooltipX,
              bottom: tooltipY,
            }}
          >
            <div>{l10n("FIELD_NUM_TRIGGERS_LABEL")}</div>
            <div>{l10n("FIELD_TRIGGERS_COUNT", { triggerCount, maxTriggers: MAX_TRIGGERS })}</div>
            {triggerCount > MAX_TRIGGERS && <div className="Scene__TooltipTitle">{l10n("FIELD_WARNING")}</div>}
            {triggerCount > MAX_TRIGGERS && <div>{l10n("WARNING_TRIGGERS_LIMIT")}</div>}
          </div>
        </Portal>
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
