import React, { useCallback, useEffect, useRef, useState } from "react";
import GlobalError from "components/error/GlobalError";
import AppToolbar from "./AppToolbar";
import ImagesPage from "components/images/ImagesPage";
import SpritesPage from "components/sprites/SpritesPage";
import DialoguePage from "components/dialogue/DialoguePage";
import WorldPage from "components/world/WorldPage";
import MusicPage from "components/music/MusicPage";
import PalettePage from "components/palettes/PalettePage";
import SettingsPage from "components/settings/SettingsPage";
import { DropZone } from "ui/upload/DropZone";
import SoundsPage from "components/sounds/SoundsPage";
import LoadingPane from "ui/loading/LoadingPane";
import styled from "styled-components";
import { useAppSelector } from "store/hooks";
import API from "renderer/lib/api";

const AppWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const AppContent = styled.div`
  width: 100%;
  height: calc(100% - 38px);
  display: flex;
  flex-direction: row;
`;

const App = () => {
  const [draggingOver, setDraggingOver] = useState(false);
  const dragLeaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const section = useAppSelector((state) => state.navigation.section);
  const error = useAppSelector((state) => state.error);
  const loaded = useAppSelector((state) => state.document.loaded);

  const onDragOver = useCallback(
    (e: DragEvent) => {
      // Don't activate dropzone unless dragging a file
      const types = e.dataTransfer?.types;
      if (!types || types.indexOf("Files") === -1) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      if (dragLeaveTimer.current) {
        clearTimeout(dragLeaveTimer.current);
      }
      if (!draggingOver) {
        setDraggingOver(true);
      }
    },
    [draggingOver],
  );

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragLeaveTimer.current) {
      clearTimeout(dragLeaveTimer.current);
    }
    dragLeaveTimer.current = setTimeout(() => {
      setDraggingOver(false);
    }, 100);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    setDraggingOver(false);
    if (!e.dataTransfer?.files) {
      return;
    }
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      API.project.addFile(file);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [onDragLeave, onDragOver, onDrop]);

  if (error.visible) {
    return <GlobalError />;
  }

  return (
    <AppWrapper>
      <AppToolbar />
      {!loaded ? (
        <LoadingPane />
      ) : (
        <AppContent>
          {section === "world" && <WorldPage />}
          {section === "images" && <ImagesPage />}
          {section === "sprites" && <SpritesPage />}
          {section === "music" && <MusicPage />}
          {section === "sounds" && <SoundsPage />}
          {section === "palettes" && <PalettePage />}
          {section === "dialogue" && <DialoguePage />}
          {section === "settings" && <SettingsPage />}
          {draggingOver && <DropZone />}
        </AppContent>
      )}
    </AppWrapper>
  );
};

export default App;
