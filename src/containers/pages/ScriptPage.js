import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import ScriptReviewLine from "../../components/script/ScriptReviewLine";
import patchScriptData from "../../lib/patchScriptData";
import trim2lines from "../../lib/trim2lines";
import { walkEvents } from "../../lib/helpers/eventSystem";
import { EVENT_TEXT } from "../../lib/compiler/eventTypes";

class ScriptsPage extends Component {
  onChange = (map, actorIndex, currentScript, id) => e => {
    const value = trim2lines(e.currentTarget.value);
    const newData = patchScriptData(currentScript, id, {
      text: value
    });
    this.props.editActor(map, actorIndex, {
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
          <h1>Script Review</h1>
          <p>
            {scriptLines.length} {scriptLines.length === 1 ? "Line" : "Lines"}
          </p>
          <p>
            {scriptWords} {scriptWords === 1 ? "Word" : "Words"}
          </p>
        </PageHeader>
        <PageContent>
          {scriptLines.map(scriptLine => (
            <ScriptReviewLine
              key={scriptLine.line.id}
              scriptLine={scriptLine}
              onChange={this.onChange(
                scriptLine.scene.id,
                scriptLine.actorIndex,
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
  editActor: actions.editActor,
  editTrigger: actions.editTrigger
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScriptsPage);
