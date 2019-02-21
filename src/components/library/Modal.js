import React from "react";
import { CloseIcon } from "./Icons";

export default ({ onClose, children }) => (
  <div className="Modal">
    <div className="Modal__Overlay" onClick={onClose} />
    <div className="Modal__Content">
      <div className="Modal__Close" onClick={onClose}>
        <CloseIcon />
      </div>
      {children}
    </div>
  </div>
);
