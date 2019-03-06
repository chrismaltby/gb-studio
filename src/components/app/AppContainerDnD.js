import { AppContainer } from "react-hot-loader";
import { DragDropContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";

const AppContainerDnD = DragDropContext(HTML5Backend)(AppContainer);

export default AppContainerDnD;
