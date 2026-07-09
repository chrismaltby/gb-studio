import React, { useCallback, useEffect, useState } from "react";
import {
  StyledConfirmModal,
  StyledConfirmCloseButton,
  StyledConfirmActions,
} from "gbs-music-web/components/dialog/style";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { CheckIcon, CloseIcon } from "ui/icons/Icons";
import { MenuOverlay } from "ui/menu/Menu";
import FocusLock from "react-focus-lock";
import appIconUrl from "gbs-music-web/components/ui/icons/app_music_icon_180.png";

interface AboutDialogProps {
  onClose: () => void;
}

declare const VERSION: string;
declare const COMMITHASH: string;

const clearAppCache = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((key) => caches.delete(key)));
    }
    window.location.reload();
  } catch {
    // ignore
  }

  window.location.reload();
};

const AboutHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const AboutHeaderText = styled.div`
  flex-grow: 1;
  text-align: center;
`;

const AboutLogo = styled.img`
  width: 180px;
  height: 180px;
  flex-shrink: 0;
  margin-top: 20px;
`;

const AboutTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const AboutText = styled.p`
  margin: 0 0 10px;
  line-height: 1.5;
  text-align: center;
  font-size: 14px;
`;

export const AboutDialog = ({ onClose }: AboutDialogProps) => {
  const [cacheCleared, setCacheCleared] = useState(false);

  const clearCache = useCallback(async () => {
    await clearAppCache();
    setCacheCleared(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <FocusLock>
      <MenuOverlay onClick={onClose} />
      <StyledConfirmModal
        role="dialog"
        aria-modal="true"
        aria-label={l10n("FIELD_ABOUT_APPNAME", { name: "GBS Music" })}
      >
        <AboutHeader>
          <StyledConfirmCloseButton onClick={onClose}>
            <CloseIcon />
          </StyledConfirmCloseButton>
          <AboutLogo src={appIconUrl} alt="GBS Music" />
          <AboutHeaderText>
            <AboutTitle>GBS Music</AboutTitle>
            <AboutText>{l10n("FIELD_CHIPTUNE_MUSIC_EDITOR")}</AboutText>
            <AboutText>
              {VERSION} ({COMMITHASH})
            </AboutText>
          </AboutHeaderText>
        </AboutHeader>
        <AboutText>{l10n("GBSTUDIO_COPYRIGHT")}</AboutText>
        <StyledConfirmActions>
          <Button onClick={clearCache}>
            {cacheCleared ? <CheckIcon /> : l10n("FIELD_CLEAR_APP_CACHE")}
          </Button>
        </StyledConfirmActions>
      </StyledConfirmModal>
    </FocusLock>
  );
};
