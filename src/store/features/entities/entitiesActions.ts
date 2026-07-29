import { createAction } from "@reduxjs/toolkit";
import { EVENT_CALL_CUSTOM_EVENT } from "consts";
import type { DeleteScriptConfirmButton } from "lib/electron/dialog/confirmDeleteCustomEvent";
import API from "renderer/lib/api";
import {
  constantName,
  customEventName,
} from "shared/lib/entities/entitiesHelpers";
import { getL10NData } from "shared/lib/lang/l10n";
import {
  actorPrefabSelectors,
  actorSelectors,
  constantSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesSelectors";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import type { AppThunk } from "store/storeTypes";
import { actions } from "./entitiesState";

const removeUnusedPalettes = createAction("entities/removeUnusedPalettes");

const confirmRemoveConstant =
  (constantId: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const state = getState();
    const constant = constantSelectors.selectById(state, constantId);
    if (!constant) {
      return;
    }

    const { findConstantUses } =
      await import("renderer/lib/workers/constantUses");
    const uses = await findConstantUses({
      constantId,
      scenes: sceneSelectors.selectAll(state),
      actorsLookup: actorSelectors.selectEntities(state),
      triggersLookup: triggerSelectors.selectEntities(state),
      actorPrefabsLookup: actorPrefabSelectors.selectEntities(state),
      triggerPrefabsLookup: triggerPrefabSelectors.selectEntities(state),
      scriptEventsLookup: scriptEventSelectors.selectEntities(state),
      customEventsLookup: customEventSelectors.selectEntities(state),
      l10NData: getL10NData(),
      scriptEventDefs: selectScriptEventDefs(state),
    });
    if (uses.length > 0) {
      const allConstants = constantSelectors.selectAll(state);
      const cancel = await API.dialog.confirmDeleteConstant(
        constantName(constant, allConstants.indexOf(constant)),
        uses.map((use) => use.name),
      );
      if (cancel) {
        return;
      }
    }

    dispatch(actions.removeConstant({ constantId }));
  };

const confirmRemoveCustomEvent =
  (customEventId: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const state = getState();
    const customEvent = customEventSelectors.selectById(state, customEventId);
    if (!customEvent) {
      return;
    }

    const allScriptEvents = scriptEventSelectors.selectAll(state);
    const referenceCount = allScriptEvents.filter(
      (scriptEvent) =>
        scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
        scriptEvent.args?.customEventId === customEventId,
    ).length;

    let deleteReferences = false;
    if (referenceCount > 0) {
      const { findScriptUses } =
        await import("renderer/lib/workers/scriptUses");
      const uses = await findScriptUses({
        scriptId: customEventId,
        scenes: sceneSelectors.selectAll(state),
        actorsLookup: actorSelectors.selectEntities(state),
        triggersLookup: triggerSelectors.selectEntities(state),
        actorPrefabsLookup: actorPrefabSelectors.selectEntities(state),
        triggerPrefabsLookup: triggerPrefabSelectors.selectEntities(state),
        scriptEventsLookup: scriptEventSelectors.selectEntities(state),
        customEventsLookup: customEventSelectors.selectEntities(state),
        l10NData: getL10NData(),
      });
      const allCustomEvents = customEventSelectors.selectAll(state);
      const sceneNames = Array.from(
        new Set(
          uses.filter((use) => use.type === "scene").map((use) => use.name),
        ),
      ).sort();
      const button = await API.dialog.confirmDeleteCustomEvent(
        customEventName(customEvent, allCustomEvents.indexOf(customEvent)),
        sceneNames,
        referenceCount,
      );

      const cancelButton: DeleteScriptConfirmButton.cancel = 2;
      const deleteReferencesButton: DeleteScriptConfirmButton.deleteReferences = 1;
      const deleteButton: DeleteScriptConfirmButton.delete = 0;
      if (button === cancelButton || button === false) {
        return;
      }
      if (button === deleteReferencesButton) {
        deleteReferences = true;
      } else if (button !== deleteButton) {
        return;
      }
    }

    dispatch(
      actions.removeCustomEvent({
        customEventId,
        deleteReferences,
      }),
    );
  };

const allActions = {
  ...actions,
  removeUnusedPalettes,
  confirmRemoveConstant,
  confirmRemoveCustomEvent,
};

export default allActions;
