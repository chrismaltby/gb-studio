import { ReactNode } from "react";
import ReactDOM from "react-dom";

export const portalRoot: HTMLElement = document.getElementById(
  "MenuPortal",
) as HTMLElement;

interface PortalProps {
  children: ReactNode;
}

export const Portal = ({ children }: PortalProps) => {
  return ReactDOM.createPortal(children, portalRoot);
};
