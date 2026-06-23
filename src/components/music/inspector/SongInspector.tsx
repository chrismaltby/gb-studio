import React from "react";
import { FormContainer, FormSectionTitle } from "ui/form/layout/FormLayout";
import { Sidebar } from "ui/sidebars/Sidebar";
import { SongMetadataProperties } from "./metadata/SongMetadataProperties";
import { useAppSelector } from "store/hooks";
import { InstrumentProperties } from "./instruments/InstrumentProperties";
import { PatternCellSelectionProperties } from "./patterns/PatternCellSelectionProperties";
import l10n from "shared/lib/lang/l10n";

export const SongInspector = () => {
  const isPatternSelection = useAppSelector(
    (state) =>
      state.tracker.sidebarView === "cell" &&
      state.tracker.selectedPatternCells.length > 0 &&
      !state.tracker.playing,
  );
  const hasSong = useAppSelector(
    (state) => !!state.trackerDocument.present.song,
  );

  if (!hasSong) {
    return null;
  }

  return (
    <Sidebar>
      <SongMetadataProperties />
      <FormContainer>
        <div style={{ marginTop: -1 }}>
          {isPatternSelection ? (
            <>
              <FormSectionTitle>{l10n("FIELD_SELECTION")}</FormSectionTitle>
              <PatternCellSelectionProperties />
            </>
          ) : (
            <InstrumentProperties />
          )}
        </div>
      </FormContainer>
    </Sidebar>
  );
};
