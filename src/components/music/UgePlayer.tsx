import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import Player from "./helpers/player";

interface UgePlayerProps {
  song: string,
  data: any,
  onPlaybackUpdate?: Function
}

export const UgePlayer = ({
  data,
  onPlaybackUpdate
}: UgePlayerProps) => {

  useEffect(() => {
    Player.initPlayer((file: string) => {
      console.log("COMPLETE");
    });
  }, []);

  useEffect(() => {
    if (onPlaybackUpdate) {
      Player.setOnIntervalCallback(onPlaybackUpdate);
    }
  }, [onPlaybackUpdate]);

  const play = useSelector(
    (state: RootState) => state.editor.playSong
  );

  useEffect(() => {
    console.log(play);
    if (play) {
      Player.play(data)
    } else {
      Player.stop();
    }
  }, [play, data])

  return (
    <div />
  )
}