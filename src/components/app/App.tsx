import React, { useCallback, useEffect, useRef, useState } from "react";
import GlobalError from "components/error/GlobalError";
import AppToolbar from "./AppToolbar";
import BackgroundsPage from "components/pages/BackgroundsPage";
import SpritesPage from "components/pages/SpritesPage";
import DialoguePage from "components/pages/DialoguePage";
import WorldPage from "components/pages/WorldPage";
import MusicPage from "components/pages/MusicPage";
import PalettePage from "components/pages/PalettePage";
import SettingsPage from "components/pages/SettingsPage";
import { DropZone } from "ui/upload/DropZone";
import projectActions from "store/features/project/projectActions";
import SoundsPage from "components/pages/SoundsPage";
import LoadingPane from "ui/loading/LoadingPane";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";

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
  const dispatch = useAppDispatch();
  const [draggingOver, setDraggingOver] = useState(false);
  const dragLeaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const section = useAppSelector((state) => state.navigation.section);
  const error = useAppSelector((state) => state.error);
  const loaded = useAppSelector((state) => state.document.loaded);

  const onDragOver = useCallback(
    (e) => {
      // Don't activate dropzone unless dragging a file
      const types = e.dataTransfer.types;
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
    [draggingOver]
  );

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragLeaveTimer.current) {
      clearTimeout(dragLeaveTimer.current);
    }
    dragLeaveTimer.current = setTimeout(() => {
      setDraggingOver(false);
    }, 100);
  }, []);

  const onDrop = useCallback(
    (e) => {
      setDraggingOver(false);
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        dispatch(projectActions.addFileToProject(file.path));
      }
    },
    [dispatch]
  );

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
          {section === "backgrounds" && <BackgroundsPage />}
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
