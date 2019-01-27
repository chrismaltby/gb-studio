import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { Textarea } from "../../components/library/Forms";
import PageHeader from "../../components/library/PageHeader";

const trim2lines = string => {
  return string
    .replace(/^([^\n]*\n[^\n]*)[\w\W]*/g, "$1")
    .split("\n")
    .map(line => line.substring(0, 18))
    .join("\n");
};

const patchData = (data, id, patch) => {
  var r = data.reduce((memo, o) => {
    if (o.true) {
      o.true = patchData(o.true, id, patch);
    }
    if (o.false) {
      o.false = patchData(o.false, id, patch);
    }
    if (o.id === id) {
      memo.push({
        ...o,
        args: {
          ...o.args,
          ...patch
        }
      });
    } else {
      memo.push(o);
    }
    return memo;
  }, []);
  return r;
};

class ScriptsPage extends Component {
  onChange = (map, actorIndex, currentScript, id) => e => {
    const value = e.currentTarget.value;
    console.log("CHANGE", {
      map,
      actorIndex,
      currentScript,
      id,
      value
    });

    const newData = patchData(currentScript, id, {
      text: value
    });

    this.props.editActor(map, actorIndex, {
      script: newData
    });

    // console.log("NEWDATA", newData);
    // onEdit(id, {
    //   text: trim2lines(e.currentTarget.value)
    // });
  };

  onEdit = (id, patch) => {
    console.log("ONEDIT", id, patch);
    const root = this.props.value;
    const input = patchData(root, id, patch);

    this.setState({
      input
    });
    this.props.onChange(input);
  };

  render() {
    const { scriptLines } = this.props;
    return (
      <div style={{ width: "100%", flexDirection: "column" }}>
        <PageHeader>
          <h1>Script Checker</h1>
          <p>
            {scriptLines.length} {scriptLines.length === 1 ? "Line" : "Lines"}
          </p>
        </PageHeader>
        <div style={{ margin: 40 }}>
          {scriptLines.map(scriptLine => (
            <div key={scriptLine.line.id}>
              <p style={{ color: "#999" }}>
                {scriptLine.actor.name} — {scriptLine.scene.name}
              </p>
              <Textarea
                fixedSize
                large
                borderless
                rows={2}
                value={scriptLine.line.args.text}
                onChange={this.onChange(
                  scriptLine.scene.id,
                  scriptLine.actorIndex,
                  scriptLine.actor.script,
                  scriptLine.line.id
                )}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
}

function walkScript(script, callback) {
  for (let i = 0; i < script.length; i++) {
    callback(script[i]);
    if (script[i].true) {
      walkScript(script[i].true, callback);
    }
    if (script[i].false) {
      walkScript(script[i].false, callback);
    }
  }
}

function mapStateToProps(state) {
  const scenes = (state.project && state.project.scenes) || [];
  const scriptLines = scenes.reduce((memo, scene) => {
    scene.actors.forEach((actor, actorIndex) => {
      walkScript(actor.script, cmd => {
        if (cmd.command === "TEXT") {
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
