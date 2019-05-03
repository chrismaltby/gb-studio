import initialState from "./initialState";
import {
  COPY_EVENT,
  COPY_ACTOR,
  COPY_TRIGGER,
  COPY_SCENE
} from "../actions/actionTypes";

export default function console(state = initialState.clipboard, action) {
  switch (action.type) {
    case COPY_EVENT:
      return {
        ...state,
        last: "event",
        event: action.event
      };
    case COPY_ACTOR:
      return {
        ...state,
        last: "actor",
        actor: action.actor
      };
    case COPY_TRIGGER:
      return {
        ...state,
        last: "trigger",
        trigger: action.trigger
      };
    case COPY_SCENE:
      return {
        ...state,
        last: "scene",
        scene: action.scene
      };
    default:
      return state;
  }
}
