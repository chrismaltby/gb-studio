import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { EngineSchema } from "lib/project/loadEngineSchema";
import keyBy from "lodash/keyBy";
import { Condition } from "shared/lib/conditionsFilter";
import {
  CollisionExtraFlag,
  CollisionTileDef,
} from "shared/lib/resources/types";
import projectActions from "store/features/project/projectActions";

export type EngineFieldType =
  | "number"
  | "slider"
  | "checkbox"
  | "select"
  | "label"
  | "togglebuttons"
  | "mask"
  | "animationstate";

export type EngineFieldCType = "UBYTE" | "UWORD" | "BYTE" | "WORD" | "define";

type EngineFieldUnitsType =
  | "px"
  | "subpx"
  | "subpxVel"
  | "subpxAcc"
  | "subpxVelPrecise" // Extra precision - take top 8-bits as per frame movement
  | "subpxAccPrecise";

export type EngineFieldSchema = {
  key: string;
  sceneType?: string;
  label: string;
  description?: string;
  group: string;
  type: EngineFieldType;
  cType: EngineFieldCType;
  defaultValue: number | string | boolean | undefined;
  min?: number;
  max?: number;
  options?: [number, string][];
  file?: string;
  conditions?: Condition[];
  editUnits?: EngineFieldUnitsType;
  isHeading?: boolean;
  indent?: number;
  runtimeOnly?: boolean;
};

export type ExtraActorCollisionFlagDef = {
  key: string;
  label: string;
  description?: string;
  setFlag: CollisionExtraFlag;
  clearFlags?: CollisionExtraFlag[];
};

export type SceneTypeSchema = {
  key: string;
  label: string;
  files?: string[];
  collisionTiles?: CollisionTileDef[];
  extraActorCollisionFlags?: ExtraActorCollisionFlagDef[];
};

export interface EngineState {
  loaded: boolean;
  fields: EngineFieldSchema[];
  lookup: Record<string, EngineFieldSchema>;
  sceneTypes: SceneTypeSchema[];
  consts: Record<string, number>;
  defaultEngineFieldId: string;
}

export const initialState: EngineState = {
  loaded: false,
  fields: [],
  lookup: {},
  sceneTypes: [],
  consts: {},
  defaultEngineFieldId: "",
};

const getDefaultEngineFieldId = (fields: EngineFieldSchema[]) => {
  const field = fields.find((f) => f.cType !== "define");
  return field ? field.key : "";
};

const sortSceneTypes = (sceneTypes: SceneTypeSchema[]) => {
  return [...sceneTypes].sort((a, b) => {
    return a.label.localeCompare(b.label);
  });
};

const engineSlice = createSlice({
  name: "engine",
  initialState,
  reducers: {
    setEngineSchema: (state, action: PayloadAction<EngineSchema>) => {
      state.fields = action.payload.fields;
      state.lookup = keyBy(action.payload.fields, "key");
      state.sceneTypes = sortSceneTypes(action.payload.sceneTypes);
      state.consts = action.payload.consts;
      state.defaultEngineFieldId = getDefaultEngineFieldId(
        action.payload.fields,
      );
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.pending, (state, _action) => {
        state.loaded = false;
      })
      .addCase(projectActions.loadProject.fulfilled, (state, action) => {
        state.fields = action.payload.engineSchema.fields;
        state.lookup = keyBy(action.payload.engineSchema.fields, "key");
        state.sceneTypes = sortSceneTypes(
          action.payload.engineSchema.sceneTypes,
        );
        state.consts = action.payload.engineSchema.consts;
        state.defaultEngineFieldId = getDefaultEngineFieldId(
          action.payload.engineSchema.fields,
        );
        state.loaded = true;
      }),
});

export const { actions } = engineSlice;

export default engineSlice.reducer;
