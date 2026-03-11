import { createAsyncThunk } from "@reduxjs/toolkit";
import { actions } from "./trackerDocumentState";
import type { MusicAsset } from "shared/lib/resources/types";
import API from "renderer/lib/api";
import { matchAssetEntity } from "shared/lib/entities/entitiesHelpers";

export const convertModToUgeSong = createAsyncThunk<
  {
    data: MusicAsset;
  },
  {
    asset: MusicAsset;
    allMusic: MusicAsset[];
  }
>("tracker/convertModToUge", async ({ asset, allMusic }) => {
  const data = await API.tracker.convertModToUge(asset);
  // Find existing asset with same filename to get correct id
  const existingAsset = matchAssetEntity(data, allMusic);
  return {
    data: existingAsset ? existingAsset : data,
  };
});

const allActions = { ...actions, convertModToUgeSong };

export default allActions;
