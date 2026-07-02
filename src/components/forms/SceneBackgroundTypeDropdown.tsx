import React from "react";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch } from "store/hooks";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import { MenuItem } from "ui/menu/Menu";

interface SceneBackgroundTypeDropdownProps {
  sceneId: string;
  tilemapEnabled: boolean;
}

export const SceneBackgroundTypeDropdown = ({
  sceneId,
  tilemapEnabled,
}: SceneBackgroundTypeDropdownProps) => {
  const dispatch = useAppDispatch();
  return (
    <DropdownButton
      size="small"
      variant="transparent"
      showArrow={false}
      label={l10n(tilemapEnabled ? "FIELD_TILEMAP" : "FIELD_IMAGE")}
    >
      <MenuItem
        onClick={() =>
          dispatch(
            entitiesActions.setTilemapLayersEnabled({
              sceneId,
              enabled: true,
            }),
          )
        }
        icon={tilemapEnabled ? <CheckIcon /> : <BlankIcon />}
      >
        {l10n("FIELD_TILEMAP")}
      </MenuItem>
      <MenuItem
        onClick={() =>
          dispatch(
            entitiesActions.setTilemapLayersEnabled({
              sceneId,
              enabled: false,
            }),
          )
        }
        icon={!tilemapEnabled ? <CheckIcon /> : <BlankIcon />}
      >
        {l10n("FIELD_IMAGE")}
      </MenuItem>
    </DropdownButton>
  );
};
