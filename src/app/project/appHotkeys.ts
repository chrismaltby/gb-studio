import { isElementHovered } from "renderer/lib/helpers/mouse";
import store, { AppState } from "store/configureStore";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";

const dispatch = store.dispatch;

type Hotkey = {
  eventName: string;
  modifier: boolean | undefined;
  shift: boolean | undefined;
  keyCode: string;
  focusCondition?: (e: KeyboardEvent) => boolean;
  condition?: (state: AppState, e: KeyboardEvent) => boolean;
  action: (state: AppState, e: KeyboardEvent) => void;
};

const hotkeys: Hotkey[] = [
  {
    eventName: "events-copy",
    modifier: true,
    shift: false,
    keyCode: "KeyC",
    focusCondition: (_e: KeyboardEvent) => {
      return true;
    },
    condition: (state: AppState) => {
      if (!state.editor.eventId) {
        return false;
      }
      const headerEl = document.getElementById(
        `script-event-header-${state.editor.eventId}`,
      );
      if (!headerEl || !isElementHovered(headerEl)) {
        return false;
      }
      return true;
    },
    action: (state: AppState) => {
      dispatch(
        clipboardActions.copyScriptEvents({
          scriptEventIds:
            state.editor.scriptEventSelectionIds.length > 0
              ? state.editor.scriptEventSelectionIds
              : [state.editor.eventId],
        }),
      );
    },
  },
  {
    eventName: "events-paste",
    modifier: true,
    shift: undefined,
    keyCode: "KeyV",
    focusCondition: (_e: KeyboardEvent) => {
      return true;
    },
    condition: (state: AppState) => {
      if (!state.editor.eventParentId) {
        return false;
      }
      if (state.editor.eventId) {
        const headerEl = document.getElementById(
          `script-event-header-${state.editor.eventId}`,
        );
        if (!headerEl || !isElementHovered(headerEl)) {
          return false;
        }
      }
      return true;
    },
    action: (state: AppState, e: KeyboardEvent) => {
      dispatch(
        clipboardActions.pasteScriptEvents({
          entityId: state.editor.eventParentId,
          type: state.editor.eventParentType,
          key: state.editor.eventParentKey,
          insertId: state.editor.eventId,
          before: !!state.editor.eventId && e.shiftKey,
        }),
      );
    },
  },
  {
    eventName: "events-group",
    modifier: true,
    shift: false,
    keyCode: "KeyG",
    condition: (state: AppState) => {
      return state.editor.scriptEventSelectionIds.length > 1;
    },
    action: (state: AppState) => {
      dispatch(
        entitiesActions.groupScriptEvents({
          scriptEventIds: state.editor.scriptEventSelectionIds,
          parentId: state.editor.eventParentId,
          parentKey: state.editor.eventParentKey,
          parentType: state.editor.eventParentType,
        }),
      );
    },
  },
  {
    eventName: "events-comment",
    modifier: true,
    shift: false,
    keyCode: "Slash",
    focusCondition: (_e: KeyboardEvent) => {
      return true;
    },
    condition: (state: AppState) => {
      if (!state.editor.eventId) {
        return false;
      }
      const headerEl = document.getElementById(
        `script-event-header-${state.editor.eventId}`,
      );
      if (!headerEl || !isElementHovered(headerEl)) {
        return false;
      }
      return true;
    },
    action: (state: AppState) => {
      dispatch(
        entitiesActions.toggleScriptEventComment({
          scriptEventId: state.editor.eventId,
          additionalScriptEventIds: state.editor.scriptEventSelectionIds,
        }),
      );
    },
  },
];

const onKeyDown = (e: KeyboardEvent) => {
  const isModifierPressed = e.metaKey || e.ctrlKey;
  const isShiftPressed = e.shiftKey;
  const isBodyFocused = e.target && (e.target as Node).nodeName === "BODY";

  const matches = hotkeys.filter(
    (hotkey) =>
      hotkey.keyCode === e.code &&
      (hotkey.modifier === undefined ||
        hotkey.modifier === isModifierPressed) &&
      (hotkey.shift === undefined || hotkey.shift === isShiftPressed) &&
      (hotkey.focusCondition ? hotkey.focusCondition(e) : isBodyFocused),
  );

  if (!matches.length) {
    return;
  }

  const state = store.getState();

  const hotKey = matches.find(
    (hotkey) => !hotkey.condition || hotkey.condition(state, e),
  );

  if (!hotKey) {
    return;
  }

  e.preventDefault();
  hotKey.action(state, e);
  fireEventHandled(hotKey.eventName);
};

const fireEventHandled = <T extends object>(eventName: string, detail?: T) => {
  document.dispatchEvent(
    new CustomEvent(`gbs::hotkey`, {
      detail: {
        eventName,
        ...detail,
        timestamp: Date.now(),
      },
    }),
  );
};

window.addEventListener("keydown", onKeyDown);
