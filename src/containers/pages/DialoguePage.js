import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import DialogueReviewLine from "../../components/script/DialogueReviewLine";
import { walkEvents, patchEvents } from "../../lib/helpers/eventSystem";
import { EVENT_TEXT } from "../../lib/compiler/eventTypes";
import l10n from "../../lib/helpers/l10n";
import { SceneShape, ActorShape, EventShape } from "../../reducers/stateShape";
import {
  getScenes,
  getActorsLookup,
  getTriggersLookup
} from "../../reducers/entitiesReducer";

class DialoguePage extends Component {
  onChange = (type, sceneId, entityIndex, currentScript, id) => value => {
    const { editScene, editActor, editTrigger } = this.props;
    const newData = patchEvents(currentScript, id, {
      text: value
    });
    if (type === "scene") {
      editScene(sceneId, {
        script: newData
      });
    } else if (type === "actor") {
      editActor(sceneId, entityIndex, {
        script: newData
      });
    } else if (type === "trigger") {
      editTrigger(sceneId, entityIndex, {
        script: newData
      });
    }
  };

  render() {
    const { dialogueLines } = this.props;
    const scriptWords = dialogueLines.reduce((memo, dialogueLine) => {
      if (
        dialogueLine &&
        dialogueLine.line &&
        dialogueLine.line.args &&
        dialogueLine.line.args.text
      ) {
        if (Array.isArray(dialogueLine.line.args.text)) {
          return (
            memo +
            dialogueLine.line.args.text.reduce((eventMemo, text) => {
              if (typeof text === "string") {
                const words = text.trim().split(/[, \n]+/);
                if (words) {
                  return eventMemo + words.length;
                }
              }
              return eventMemo;
            }, 0)
          );
        }
        if (typeof dialogueLine.line.args.text === "string") {
          const words = dialogueLine.line.args.text.trim().split(/[, \n]+/);
          if (words) {
            return memo + words.length;
          }
          return memo;
        }
      }
      return memo;
    }, 0);
    return (
      <div style={{ width: "100%", flexDirection: "column", overflow: "auto" }}>
        <PageHeader>
          <h1>{l10n("DIALOGUE_REVIEW")}</h1>
          <p>
            {dialogueLines.length}{" "}
            {dialogueLines.length === 1
              ? l10n("DIALOGUE_LINE")
              : l10n("DIALOGUE_LINES")}
          </p>
          <p>
            {scriptWords}{" "}
            {scriptWords === 1 ? l10n("DIALOGUE_WORD") : l10n("DIALOGUE_WORDS")}
          </p>
        </PageHeader>
        <PageContent>
          <section>
            {dialogueLines.map(dialogueLine => (
              <DialogueReviewLine
                key={dialogueLine.line.id}
                dialogueLine={dialogueLine}
                onChange={this.onChange(
                  dialogueLine.entityType,
                  dialogueLine.sceneId,
                  dialogueLine.entity.id,
                  dialogueLine.entity.script,
                  dialogueLine.line.id
                )}
              />
            ))}
          </section>
        </PageContent>
      </div>
    );
  }
}

DialoguePage.propTypes = {
  editActor: PropTypes.func.isRequired,
  editTrigger: PropTypes.func.isRequired,
  editScene: PropTypes.func.isRequired,
  dialogueLines: PropTypes.arrayOf(
    PropTypes.shape({
      scene: SceneShape,
      actor: ActorShape,
      entityIndex: PropTypes.number,
      line: EventShape
    })
  ).isRequired
};

function mapStateToProps(state) {
  const scenes = getScenes(state);
  const actorsLookup = getActorsLookup(state);
  const triggersLookup = getTriggersLookup(state);
  // const dialogueLines = [];

  const dialogueLines = scenes.reduce((memo, scene, sceneIndex) => {
    scene.actors.forEach((actorId, actorIndex) => {
      const actor = actorsLookup[actorId];
      walkEvents(actor.script, cmd => {
        if (cmd.command === EVENT_TEXT) {
          memo.push({
            sceneId: scene.id,
            entityType: "actor",
            entity: actor,
            entityIndex: actorIndex,
            entityName: actor.name || `Actor ${actorIndex + 1}`,
            sceneName: scene.name || `Scene ${sceneIndex + 1}`,
            line: cmd
          });
        }
      });
    });
    scene.triggers.forEach((triggerId, triggerIndex) => {
      const trigger = triggersLookup[triggerId];
      walkEvents(trigger.script, cmd => {
        if (cmd.command === EVENT_TEXT) {
          memo.push({
            sceneId: scene.id,
            entityType: "trigger",
            entity: trigger,
            entityIndex: triggerIndex,
            entityName: trigger.name || `Trigger ${triggerIndex + 1}`,
            sceneName: scene.name || `Scene ${sceneIndex + 1}`,
            line: cmd
          });
        }
      });
    });
    walkEvents(scene.script, cmd => {
      if (cmd.command === EVENT_TEXT) {
        memo.push({
          sceneId: scene.id,
          entityType: "scene",
          entity: scene,
          entityIndex: sceneIndex,
          entityName: scene.name,
          sceneName: scene.name,
          line: cmd
        });
      }
    });
    return memo;
  }, []);

  return {
    dialogueLines
  };
}

const mapDispatchToProps = {
  editActor: actions.editActor,
  editTrigger: actions.editTrigger,
  editScene: actions.editScene
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DialoguePage);
