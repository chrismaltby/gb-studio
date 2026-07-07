import React from "react";
import { useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import { MAX_BACKGROUND_TILES, MAX_BACKGROUND_TILES_CGB } from "consts";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { Alert } from "ui/alerts/Alert";
import StyledAlert from "ui/alerts/style";

interface SceneTilemapInfoPaneProps {
  sceneId: string;
}

const InfoPane = styled.div`
  font-size: 11px;
  padding: 10px;

  ${StyledAlert} {
    margin-top: 10px;
  }
`;

const SceneTilemapInfoPane = ({ sceneId }: SceneTilemapInfoPaneProps) => {
  const sceneTilemapInfo = useAppSelector(
    (state) => state.assets.sceneTilemaps[sceneId],
  );

  const cgbOnly = useAppSelector((state) => {
    const colorModeOverride = sceneSelectors.selectById(
      state,
      sceneId,
    )?.colorModeOverride;
    if (!colorModeOverride || colorModeOverride === "none") {
      return state.project.present.settings.colorMode === "color";
    }
    return colorModeOverride === "color";
  });

  const maxTiles = cgbOnly ? MAX_BACKGROUND_TILES_CGB : MAX_BACKGROUND_TILES;

  if (!sceneTilemapInfo) {
    return null;
  }

  return (
    <>
      <SplitPaneHeader collapsed={false} borderTop>
        {l10n("FIELD_INFO")}
      </SplitPaneHeader>
      <InfoPane>
        {l10n("FIELD_UNIQUE_TILES")}: {sceneTilemapInfo.numTiles ?? 0}
        {" / "}
        {maxTiles}
        {sceneTilemapInfo.warnings.map((warning, index) => (
          <Alert key={index} variant="warning">
            {warning}
          </Alert>
        ))}
      </InfoPane>
    </>
  );
};

export default React.memo(SceneTilemapInfoPane);
