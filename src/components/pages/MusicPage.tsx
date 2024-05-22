import React from "react";
import { useAppSelector } from "store/hooks";
import MusicPageUge from "./MusicPageUge";
import MusicPageMod from "./MusicPageMod";

const MusicPage = () => {
  const settings = useAppSelector((state) => state.project.present.settings);

  return settings.musicDriver === "huge" ? <MusicPageUge /> : <MusicPageMod />;
};

export default MusicPage;
