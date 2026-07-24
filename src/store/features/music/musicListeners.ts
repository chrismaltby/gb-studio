import { isAnyOf, type TypedStartListening } from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import { assetPath } from "shared/lib/helpers/assets";
import { musicSelectors } from "store/features/entities/entitiesSelectors";
import navigationActions from "store/features/navigation/navigationActions";
import type { RootState } from "store/storeTypes";
import musicActions from "./musicActions";

type StartAppListening = TypedStartListening<RootState>;

export const registerMusicListeners = (startListening: StartAppListening) => {
  startListening({
    actionCreator: musicActions.playMusic,
    effect: (action, listenerApi) => {
      const track = musicSelectors.selectById(
        listenerApi.getState(),
        action.payload.musicId,
      );
      if (!track) {
        return;
      }

      const filename = assetPath("music", track);
      if (track.type === "uge") {
        API.music.playUGE(filename);
      } else {
        API.music.playMOD(filename, !track.settings.disableSpeedConversion);
      }
    },
  });

  startListening({
    actionCreator: musicActions.pauseMusic,
    effect: () => {
      API.music.closeMusic();
    },
  });

  startListening({
    matcher: isAnyOf(
      navigationActions.setSection,
      navigationActions.setNavigationId,
    ),
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(musicActions.pauseMusic());
    },
  });
};
