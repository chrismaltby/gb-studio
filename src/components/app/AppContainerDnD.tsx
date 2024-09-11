import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const AppContainerDnD = ({ children }: { children: React.ReactElement }) => {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
};

export default AppContainerDnD;
