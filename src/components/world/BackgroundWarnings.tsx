import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import Alert, { AlertItem } from "ui/alerts/Alert";

interface BackgroundWarningsProps {
  id: string;
}

const BackgroundWarnings = ({ id }: BackgroundWarningsProps) => {
  const backgroundWarningsLookup = useSelector(
    (state: RootState) => state.assets.backgrounds
  );
  const savedWarnings = backgroundWarningsLookup[id];
  const warnings = savedWarnings ? savedWarnings.warnings : [];

  if (warnings.length === 0) {
    return <></>;
  }

  return (
    <Alert variant="warning">
      {warnings.map((warning) => (
        <AlertItem key={warning}>{warning}</AlertItem>
      ))}
    </Alert>
  );
};

export default BackgroundWarnings;
