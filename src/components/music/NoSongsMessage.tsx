import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import settingsActions from "../../store/features/settings/settingsActions";
import { SettingsState } from "../../store/features/settings/settingsState";
import { Button } from "../ui/buttons/Button";

export const NoSongsMessage = () => {
  const dispatch = useDispatch();
  const [showMessage, setShowMessage] = useState(false);

  const editSettings = useCallback(
    (patch: Partial<SettingsState>) => {
      dispatch(settingsActions.editSettings(patch));
    },
    [dispatch]
  );

  return (
    <>
      <h2>No songs found</h2>
      <p>
        Please add .uge files to the project <i>assets/music</i> folder.
      </p>
      <p 
        onClick={() => setShowMessage(!showMessage)}
        style={{ textDecoration: "underline", cursor: "pointer" }}
      >
        What about .mod files?
      </p>
      { showMessage ? 
        <>
          <p>
            Your project is currently configured to use <strong>hUGEDriver</strong> as its music driver. 
          </p>
          <p>  
            If you want to use .mod files instead, you can enable <strong>GBT Player</strong>. You can change this later in 'Settings'.
          </p>  
          <Button onClick={() => editSettings({ musicDriver: "gbt" })}>Enable GBT Player</Button>
        </>
      : "" }
    </>
  )
}

