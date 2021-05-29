import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import MusicPageUge from "./MusicPageUge";
import MusicPageMod from "./MusicPageMod";

const MusicPage = () => {
  const settings = useSelector(
    (state: RootState) => state.project.present.settings
  );

  return settings.musicDriver === "huge" ? <MusicPageUge /> : <MusicPageMod />;
};

export default MusicPage;
