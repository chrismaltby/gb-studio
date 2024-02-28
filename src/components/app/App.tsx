import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import GlobalError from "components/error/GlobalError";
import AppToolbar from "./AppToolbar";
import BackgroundsPage from "components/pages/BackgroundsPage";
import SpritesPage from "components/pages/SpritesPage";
import DialoguePage from "components/pages/DialoguePage";
import BuildPage from "components/pages/BuildPage";
import WorldPage from "components/pages/WorldPage";
import MusicPage from "components/pages/MusicPage";
import PalettePage from "components/pages/PalettePage";
import SettingsPage from "components/pages/SettingsPage";
import { DropZone } from "ui/upload/DropZone";
import projectActions from "store/features/project/projectActions";
import SoundsPage from "components/pages/SoundsPage";
import { RootState } from "store/configureStore";
import LoadingPane from "ui/loading/LoadingPane";

const App = () => {
  const dispatch = useDispatch();
  const [draggingOver, setDraggingOver] = useState(false);
  const dragLeaveTimer = useRef<number>();
  const section = useSelector((state: RootState) => state.navigation.section);
  const error = useSelector((state: RootState) => state.error);
  const loaded = useSelector((state: RootState) => state.document.loaded);

  const onDragOver = useCallback(
    (e) => {
      // Don't activate dropzone unless dragging a file
      const types = e.dataTransfer.types;
      if (!types || types.indexOf("Files") === -1) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      clearTimeout(dragLeaveTimer.current);
      if (!draggingOver) {
        setDraggingOver(true);
      }
    },
    [draggingOver]
  );

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(dragLeaveTimer.current);
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
    <div className="App">
      <AppToolbar />
      {!loaded ? (
        <LoadingPane />
      ) : (
        <div className="App__Content">
          {section === "world" && <WorldPage />}
          {section === "backgrounds" && <BackgroundsPage />}
          {section === "sprites" && <SpritesPage />}
          {section === "music" && <MusicPage />}
          {section === "sounds" && <SoundsPage />}
          {section === "palettes" && <PalettePage />}
          {section === "dialogue" && <DialoguePage />}
          {section === "build" && <BuildPage />}
          {section === "settings" && <SettingsPage />}
          {draggingOver && <DropZone />}
        </div>
      )}
    </div>
  );
};

export default App;
