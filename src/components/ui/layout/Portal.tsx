import { FC } from "react";
import ReactDOM from "react-dom";

export const Portal: FC = (props) => {
  const root: HTMLElement = document.getElementById(
    "MenuPortal"
  ) as HTMLElement;
  return ReactDOM.createPortal(props.children, root);
};
