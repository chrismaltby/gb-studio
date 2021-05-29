import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import l10n from "lib/helpers/l10n";
import {
  sceneSelectors,
  actorSelectors,
} from "store/features/entities/entitiesState";

class StatusBar extends Component {
  render() {
    const { sceneName, x, y, actor } = this.props;
    if (!sceneName) {
      return <div />;
    }
    return (
      <div className="StatusBar">
        {sceneName !== undefined && (
          <span>
            {sceneName}
            {": "}
          </span>
        )}
        {x !== undefined && (
          <span>
            {l10n("FIELD_X")}={x}{" "}
          </span>
        )}
        {y !== undefined && (
          <span>
            {l10n("FIELD_Y")}={y}{" "}
          </span>
        )}
        {actor !== undefined && (
          <span>
            {l10n("ACTOR")}={actor}{" "}
          </span>
        )}
      </div>
    );
  }
}

StatusBar.propTypes = {
  sceneName: PropTypes.string,
  x: PropTypes.number,
  y: PropTypes.number,
  actor: PropTypes.string,
};

StatusBar.defaultProps = {
  sceneName: undefined,
  x: undefined,
  y: undefined,
  actor: undefined,
};

function mapStateToProps(state) {
  const { sceneId, actorId, x, y } = state.editor.hover;
  const scene = sceneSelectors.selectById(state, sceneId);
  const actor = actorSelectors.selectById(state, actorId);
  return {
    sceneName: scene && scene.name,
    actor: actor && actor.name,
    x,
    y,
  };
}

export default connect(mapStateToProps)(StatusBar);
