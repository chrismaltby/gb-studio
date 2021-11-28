/* eslint-disable react/no-array-index-key */
import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { SceneShape, ActorShape, EventShape } from "store/stateShape";
import { ArrowIcon, SearchIcon } from "ui/icons/Icons";
import { walkEvents, patchEvents } from "lib/helpers/eventSystem";
import { EVENT_TEXT } from "lib/compiler/eventTypes";
import DialogueReviewLine from "./DialogueReviewLine";
import Button from "../library/Button";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import navigationActions from "store/features/navigation/navigationActions";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  walkNormalisedActorEvents,
  walkNormalisedSceneSpecificEvents,
  walkNormalisedTriggerEvents,
} from "store/features/entities/entitiesHelpers";

class DialogueReviewScene extends Component {
  onChange = (id) => (value) => {
    const { editScriptEventArg } = this.props;
    editScriptEventArg({
      scriptEventId: id,
      key: "text",
      value,
    });
  };

  onSearch = () => {
    const { setSection, editSearchTerm, scene } = this.props;
    setSection("world");
    setTimeout(() => {
      editSearchTerm(undefined);
      editSearchTerm(scene.id);
    }, 1);
  };

  render() {
    const { scene, sceneIndex, onToggle, open, dialogueLines } = this.props;

    if (dialogueLines.length === 0) {
      return null;
    }

    return (
      <section
        className={cx("DialogueReviewScene", {
          "DialogueReviewScene--Open": open,
        })}
      >
        <div className="DialogueReviewScene__SceneName">
          <h2 onClick={onToggle}>
            <ArrowIcon />
            {scene.name || `Scene ${sceneIndex + 1}`}
          </h2>
          <Button small onClick={this.onSearch}>
            <SearchIcon />
          </Button>
        </div>

        <div>
          {open &&
            dialogueLines.map((dialogueLine) => (
              <DialogueReviewLine
                key={dialogueLine.line.id}
                dialogueLine={dialogueLine}
                onChange={this.onChange(dialogueLine.line.id)}
              />
            ))}
        </div>
      </section>
    );
  }
}

DialogueReviewScene.propTypes = {
  scene: SceneShape.isRequired,
  sceneIndex: PropTypes.number.isRequired,
  open: PropTypes.bool.isRequired,
  editActor: PropTypes.func.isRequired,
  editTrigger: PropTypes.func.isRequired,
  editScene: PropTypes.func.isRequired,
  dialogueLines: PropTypes.arrayOf(
    PropTypes.shape({
      scene: SceneShape,
      actor: ActorShape,
      entityIndex: PropTypes.number,
      line: EventShape,
    })
  ).isRequired,
  onToggle: PropTypes.func.isRequired,
  setSection: PropTypes.func.isRequired,
  editSearchTerm: PropTypes.func.isRequired,
};

function mapStateToProps(state, props) {
  const scenesLookup = sceneSelectors.selectEntities(state);
  const actorsLookup = actorSelectors.selectEntities(state);
  const triggersLookup = triggerSelectors.selectEntities(state);
  const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
  const scene = scenesLookup[props.id];
  const sceneIndex = props.sceneIndex;

  const memo = [];
  scene.actors.forEach((actorId, actorIndex) => {
    const actor = actorsLookup[actorId];
    walkNormalisedActorEvents(actor, scriptEventsLookup, undefined, (cmd) => {
      if (cmd.command === EVENT_TEXT) {
        memo.push({
          sceneId: scene.id,
          entityType: "actor",
          entity: actor,
          entityIndex: actorIndex,
          entityName: actor.name || `Actor ${actorIndex + 1}`,
          sceneName: scene.name || `Scene ${sceneIndex + 1}`,
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
            entityName: trigger.name || `Trigger ${triggerIndex + 1}`,
            sceneName: scene.name || `Scene ${sceneIndex + 1}`,
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
          entityName: scene.name,
          sceneName: scene.name,
          line: cmd,
        });
      }
    }
  );

  return {
    scene,
    dialogueLines: memo,
  };
}

const mapDispatchToProps = {
  editScriptEventArg: entitiesActions.editScriptEventArg,
  editSearchTerm: editorActions.editSearchTerm,
  setSection: navigationActions.setSection,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DialogueReviewScene);
