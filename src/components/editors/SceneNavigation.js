import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { TriggerIcon } from "../library/Icons";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import { MAX_ACTORS, MAX_TRIGGERS } from "../../consts";
import {
  SceneShape,
  ActorShape,
  TriggerShape
} from "../../store/stateShape";
import { SidebarHeading } from "./Sidebar";
import l10n from "../../lib/helpers/l10n";
import { actions as editorActions } from "../../store/features/editor/editorSlice";
import { actorSelectors, triggerSelectors, sceneSelectors } from "../../store/features/entities/entitiesSlice";

class SceneNavigation extends Component {
  render() {
    const { scene, actorsLookup, triggersLookup } = this.props;

    return (
      (scene.actors.length > 0 || scene.triggers.length > 0) && (
        <div>
          <SidebarHeading title={l10n("SIDEBAR_NAVIGATION")} />
          <ul>
            {scene.actors.map((actorId, index) => (
              <li
                key={actorId}
                onClick={() => {
                  const { selectActor } = this.props;
                  selectActor({sceneId: scene.id, actorId});
                }}
                className={cx({ Navigation__Error: index >= MAX_ACTORS })}
              >
                <div className="EditorSidebar__Icon">
                  <SpriteSheetCanvas
                    spriteSheetId={actorsLookup[actorId].spriteSheetId}
                    direction={actorsLookup[actorId].direction}
                  />
                </div>
                {actorsLookup[actorId].name || `Actor ${index + 1}`}
              </li>
            ))}
            {scene.triggers.map((triggerId, index) => (
              <li
                key={triggerId}
                onClick={() => {
                  const { selectTrigger } = this.props;
                  selectTrigger({sceneId: scene.id, triggerId});
                }}
                className={cx({ Navigation__Error: index >= MAX_TRIGGERS })}
              >
                <div className="EditorSidebar__Icon">
                  <TriggerIcon />
                </div>
                {triggersLookup[triggerId].name || `Trigger ${index + 1}`}
              </li>
            ))}
          </ul>
        </div>
      )
    );
  }
}

SceneNavigation.propTypes = {
  scene: SceneShape.isRequired,
  actorsLookup: PropTypes.objectOf(ActorShape).isRequired,
  triggersLookup: PropTypes.objectOf(TriggerShape).isRequired,
  selectActor: PropTypes.func.isRequired,
  selectTrigger: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
  const scene = sceneSelectors.selectById(state, props.sceneId);  
  const actorsLookup = actorSelectors.selectEntities(state);
  const triggersLookup = triggerSelectors.selectEntities(state);
  return { scene, actorsLookup, triggersLookup };
}

const mapDispatchToProps = {
  selectActor: editorActions.selectActor,
  selectTrigger: editorActions.selectTrigger
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SceneNavigation);
