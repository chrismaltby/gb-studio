import React from "react";
import { SongMetadataProperties } from "components/music/inspector/metadata/SongMetadataProperties";
import { Button } from "ui/buttons/Button";
import { CaretRightIcon, HelpIcon, UndoIcon } from "ui/icons/Icons";
import { useAppDispatch, useAppSelector } from "store/hooks";
import trackerActions from "store/features/tracker/trackerActions";
import styled from "styled-components";
import { FormDivider, FormRow } from "ui/form/layout/FormLayout";
import { Label } from "ui/form/Label";
import l10n from "shared/lib/lang/l10n";
import { FixedSpacer, FlexGrow } from "ui/spacing/Spacing";
import { TRACKER_UNDO } from "consts";
import {
  StyledMobileListMenu,
  StyledMobileListMenuItem,
  StyledMobileListMenuCaret,
} from "gbs-music-web/components/ui/style";
import { MusicWebViewSelect } from "gbs-music-web/components/MusicWebViewSelect";

const StyledViewSelection = styled.div`
  padding-top: 10px;
  width: 100%;
`;

const StyledHelpButton = styled.a`
  user-select: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  height: 28px;
  min-width: 24px;
  white-space: nowrap;
  padding: 0px 10px;
  box-sizing: border-box;
  font-weight: normal;
  border-width: 1px;
  overflow: hidden;
  flex-shrink: 0;
  background: transparent;
  border-color: transparent;
  color: ${(props) => props.theme.colors.button.text};
  min-width: 32px;
  height: 38px;
  margin-bottom: 10px;
  text-decoration: none;

  svg {
    height: 17px;
    width: 17px;
    max-width: 100%;
    max-height: 100%;
    min-width: 17px;
    fill: ${(props) => props.theme.colors.button.text};
  }
`;

export const MusicWebSettingPane = () => {
  const dispatch = useAppDispatch();

  const hasSong = useAppSelector(
    (state) => !!state.trackerDocument.present.song,
  );

  if (!hasSong) {
    return null;
  }

  return (
    <div>
      <SongMetadataProperties />

      <StyledViewSelection>
        <FormRow>
          <Label>{l10n("MENU_VIEW")}</Label>
        </FormRow>
        <FormRow>
          <MusicWebViewSelect />
        </FormRow>
      </StyledViewSelection>

      <FormDivider />

      <StyledMobileListMenu>
        <StyledMobileListMenuItem
          onClick={() => {
            dispatch(trackerActions.setMobileOverlayView("instrumentsList"));
          }}
        >
          <span>{l10n("FIELD_EDIT_INSTRUMENTS")}</span>
          <StyledMobileListMenuCaret>
            <CaretRightIcon />
          </StyledMobileListMenuCaret>
        </StyledMobileListMenuItem>
        <StyledMobileListMenuItem
          onClick={() => {
            dispatch(trackerActions.setMobileOverlayView("sequence"));
          }}
        >
          <span>{l10n("FIELD_EDIT_PATTERN_ORDER")}</span>
          <StyledMobileListMenuCaret>
            <CaretRightIcon />
          </StyledMobileListMenuCaret>
        </StyledMobileListMenuItem>
      </StyledMobileListMenu>

      <FixedSpacer height={10} />
      <FormDivider />

      <FormRow>
        <StyledHelpButton
          href="https://www.gbstudio.dev/docs/assets/music/music-huge"
          target="_blank"
          rel="noreferrer"
        >
          <HelpIcon />
          <FixedSpacer width={10} />
          {l10n("MENU_HELP")}
        </StyledHelpButton>
        <FlexGrow />
        <Button
          variant="transparent"
          onClick={() => {
            dispatch({ type: TRACKER_UNDO });
            dispatch(trackerActions.setMobileOverlayView("none"));
          }}
        >
          <UndoIcon />
          <FixedSpacer width={10} />
          {l10n("MENU_UNDO")}
        </Button>
      </FormRow>
    </div>
  );
};
