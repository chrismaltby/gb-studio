import { FC } from "react";
import ReactDOM from "react-dom";

export const portalRoot: HTMLElement = document.getElementById(
  "MenuPortal"
) as HTMLElement;

export const Portal: FC = (props) => {
  return ReactDOM.createPortal(props.children, portalRoot);
};
