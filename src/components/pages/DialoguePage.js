import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import PageHeader from "components/library/PageHeader";
import PageContent from "components/library/PageContent";
import l10n from "renderer/lib/l10n";
import { SceneShape, ActorShape, EventShape } from "store/stateShape";
import DialogueReviewScene from "components/script/DialogueReviewScene";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import {
  actorName,
  sceneName,
  triggerName,
  walkNormalisedActorEvents,
  walkNormalisedSceneSpecificEvents,
  walkNormalisedTriggerEvents,
} from "store/features/entities/entitiesHelpers";
import { EVENT_TEXT } from "consts";

class DialoguePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openScenes: [],
    };
  }

  onToggleScene = (sceneId) => (_e) => {
    const { openScenes } = this.state;
    if (openScenes.includes(sceneId)) {
      this.setState({
        openScenes: openScenes.filter((id) => id !== sceneId),
      });
    } else {
      this.setState({
        openScenes: [].concat(openScenes, sceneId),
      });
    }
  };

  render() {
    const { dialogueLines, scenes } = this.props;
    const { openScenes } = this.state;

    const sortedScenes = scenes
      .map((scene, sceneIndex) => ({
        id: scene.id,
        name: sceneName(scene, sceneIndex),
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

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
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
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
          {sortedScenes.map((scene) => (
            <DialogueReviewScene
              id={scene.id}
              key={scene.id}
              sceneIndex={scenes.findIndex((s) => s.id === scene.id)}
              open={openScenes.includes(scene.id)}
              onToggle={this.onToggleScene(scene.id)}
            />
          ))}
        </PageContent>
      </div>
    );
  }
}

DialoguePage.propTypes = {
  scenes: PropTypes.arrayOf(SceneShape).isRequired,
  dialogueLines: PropTypes.arrayOf(
    PropTypes.shape({
      scene: SceneShape,
      actor: ActorShape,
      entityIndex: PropTypes.number,
      line: EventShape,
    })
  ).isRequired,
};

function mapStateToProps(state) {
  const scenes = sceneSelectors.selectAll(state);
  const actorsLookup = actorSelectors.selectEntities(state);
  const triggersLookup = triggerSelectors.selectEntities(state);
  const scriptEventsLookup = scriptEventSelectors.selectEntities(state);

  const dialogueLines = scenes.reduce((memo, scene, sceneIndex) => {
    scene.actors.forEach((actorId, actorIndex) => {
      const actor = actorsLookup[actorId];
      walkNormalisedActorEvents(actor, scriptEventsLookup, undefined, (cmd) => {
        if (cmd.command === EVENT_TEXT) {
          memo.push({
            sceneId: scene.id,
            entityType: "actor",
            entity: actor,
            entityIndex: actorIndex,
            entityName: actorName(actor, actorIndex),
            sceneName: sceneName(scene, sceneIndex),
            line: cmd,
          });
        }
      });
    });
    scene.triggers.forEach((triggerId, triggerIndex) => {
      const trigger = triggersLookup[triggerId];
      walkNormalisedTriggerEvents(
        trigger,
        scriptEventsLookup,
        undefined,
        (cmd) => {
          if (cmd.command === EVENT_TEXT) {
            memo.push({
              sceneId: scene.id,
              entityType: "trigger",
              entity: trigger,
              entityIndex: triggerIndex,
              entityName: triggerName(trigger, triggerIndex),
              sceneName: sceneName(scene, sceneIndex),
              line: cmd,
            });
          }
        }
      );
    });
    walkNormalisedSceneSpecificEvents(
      scene,
      scriptEventsLookup,
      undefined,
      (cmd) => {
        if (cmd.command === EVENT_TEXT) {
          memo.push({
            sceneId: scene.id,
            entityType: "scene",
            entity: scene,
            entityIndex: sceneIndex,
            entityName: sceneName(scene, sceneIndex),
            sceneName: sceneName(scene, sceneIndex),
            line: cmd,
          });
        }
      }
    );
    return memo;
  }, []);

  return {
    dialogueLines,
    scenes,
  };
}

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(DialoguePage);
