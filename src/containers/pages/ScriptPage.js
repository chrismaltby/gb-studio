import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import ScriptReviewLine from "../../components/script/ScriptReviewLine";
import { walkEvents, patchEvents } from "../../lib/helpers/eventSystem";
import { EVENT_TEXT } from "../../lib/compiler/eventTypes";
import l10n from "../../lib/helpers/l10n";
import { SceneShape, ActorShape, EventShape } from "../../reducers/stateShape";

class ScriptsPage extends Component {
  onChange = (map, actorIndex, currentScript, id) => value => {
    const { editActor } = this.props;
    const newData = patchEvents(currentScript, id, {
      text: value
    });
    editActor(map, actorIndex, {
      script: newData
    });
  };

  render() {
    const { scriptLines } = this.props;
    const scriptWords = scriptLines.reduce((memo, scriptLine) => {
      if (
        scriptLine &&
        scriptLine.line &&
        scriptLine.line.args &&
        scriptLine.line.args.text &&
        scriptLine.line.args.text.split
      ) {
        const words = scriptLine.line.args.text.trim().split(/[, \n]+/);
        if (words) {
          return memo + words.length;
        }
      }
      return memo;
    }, 0);
    return (
      <div style={{ width: "100%", flexDirection: "column", overflow: "auto" }}>
        <PageHeader>
          <h1>{l10n("SCRIPT_REVIEW")}</h1>
          <p>
            {scriptLines.length}{" "}
            {scriptLines.length === 1
              ? l10n("SCRIPT_LINE")
              : l10n("SCRIPT_LINES")}
          </p>
          <p>
            {scriptWords}{" "}
            {scriptWords === 1 ? l10n("SCRIPT_WORD") : l10n("SCRIPT_WORDS")}
          </p>
        </PageHeader>
        <PageContent>
          {scriptLines.map(scriptLine => (
            <ScriptReviewLine
              key={scriptLine.line.id}
              scriptLine={scriptLine}
              onChange={this.onChange(
                scriptLine.scene.id,
                scriptLine.actor.id,
                scriptLine.actor.script,
                scriptLine.line.id
              )}
            />
          ))}
        </PageContent>
      </div>
    );
  }
}

ScriptsPage.propTypes = {
  editActor: PropTypes.func.isRequired,
  scriptLines: PropTypes.arrayOf(
    PropTypes.shape({
      scene: SceneShape,
      actor: ActorShape,
      actorIndex: PropTypes.number,
      line: EventShape
    })
  ).isRequired
};

function mapStateToProps(state) {
  const scenes = (state.project.present && state.project.present.scenes) || [];
  const scriptLines = scenes.reduce((memo, scene) => {
    scene.actors.forEach((actor, actorIndex) => {
      walkEvents(actor.script, cmd => {
        if (cmd.command === EVENT_TEXT) {
          memo.push({
            scene,
            actor,
            actorIndex,
            line: cmd
          });
        }
      });
    });
    return memo;
  }, []);
  return {
    scriptLines
  };
}

const mapDispatchToProps = {
  editActor: actions.editActor
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScriptsPage);
