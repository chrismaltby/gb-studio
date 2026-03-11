import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import soundfxActions from "store/features/soundfx/soundfxActions";
import navigationActions from "store/features/navigation/navigationActions";
import actions from "./musicActions";
import { musicSelectors } from "store/features/entities/entitiesState";
import { assetPath } from "shared/lib/helpers/assets";
import API from "renderer/lib/api";

const musicMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.playMusic.match(action)) {
      const state = store.getState();
      const track = musicSelectors.selectById(state, action.payload.musicId);
      if (track) {
        const filename = assetPath("music", track);
        if (track.type === "uge") {
          API.music.playUGE(filename);
        } else {
          API.music.playMOD(filename, !track.settings.disableSpeedConversion);
        }
      }
    } else if (actions.pauseMusic.match(action)) {
      API.music.closeMusic();
    } else if (
      soundfxActions.playSoundFxBeep.match(action) ||
      soundfxActions.playSoundFxTone.match(action) ||
      soundfxActions.playSoundFxCrash.match(action) ||
      navigationActions.setSection.match(action) ||
      navigationActions.setNavigationId.match(action)
    ) {
      store.dispatch(actions.pauseMusic());
    }

    return next(action);
  };

export default musicMiddleware;
