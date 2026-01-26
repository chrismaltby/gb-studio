import { createAction } from "@reduxjs/toolkit";
import { actions } from "./entitiesState";

const removeUnusedPalettes = createAction("entities/removeUnusedPalettes");

const allActions = { ...actions, removeUnusedPalettes };

export default allActions;
