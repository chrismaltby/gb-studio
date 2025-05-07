import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const AppContainerDnD = (props: { children: React.ReactElement }) => {
  return <DndProvider backend={HTML5Backend} {...props} />;
};

export default AppContainerDnD;
