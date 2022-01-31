import React from "react";
import l10n from "lib/helpers/l10n";
import "./LoadingPane.css";

const LoadingPane = () => (
  <div className="LoadingPane">
    <div className="LoadingPane__Content">{l10n("FIELD_LOADING")}</div>
  </div>
);

export default LoadingPane;
