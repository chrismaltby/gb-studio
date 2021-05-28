import React from "react";
import { AppContainer } from "react-hot-loader";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const AppContainerDnD = ({ children }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <AppContainer>{children}</AppContainer>
    </DndProvider>
  );
};

export default AppContainerDnD;
