import DirectionPicker from "components/forms/DirectionPicker";
import React, { Dispatch } from "react";
import { AnyAction } from "redux";
import { ActorDirection } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import { LabelButton } from "ui/buttons/LabelButton";
import { MenuDivider, MenuItem, MenuSection } from "ui/menu/Menu";

interface SceneContextMenuProps {
  dispatch: Dispatch<AnyAction>;
  sceneId: string;
  startSceneId: string;
  startDirection: ActorDirection;
  hoverX: number;
  hoverY: number;
  onRename?: () => void;
}

const renderSceneContextMenu = ({
  sceneId,
  onRename,
  dispatch,
  startSceneId,
  startDirection,
  hoverX,
  hoverY,
}: SceneContextMenuProps) => {
  return [
    <MenuSection style={{ paddingRight: 10, marginBottom: 5 }}>
      <div style={{ display: "flex" }}>
        <div style={{ marginRight: 5 }}>
          <LabelButton
            onClick={() =>
              dispatch(
                entitiesActions.editScene({
                  sceneId,
                  changes: {
                    labelColor: "",
                  },
                })
              )
            }
          />
        </div>
        {["red", "orange", "yellow", "green", "blue", "purple", "gray"].map(
          (color) => (
            <div key={color} style={{ marginRight: color === "gray" ? 0 : 5 }}>
              <LabelButton
                color={color}
                onClick={() =>
                  dispatch(
                    entitiesActions.editScene({
                      sceneId,
                      changes: {
                        labelColor: color,
                      },
                    })
                  )
                }
              />
            </div>
          )
        )}
      </div>
    </MenuSection>,
    <MenuDivider key="div-direction" />,
    <MenuItem
      key="startingScene"
      onClick={() =>
        dispatch(
          settingsActions.editSettings({
            startSceneId: sceneId,
            startX: hoverX,
            startY: hoverY,
          })
        )
      }
    >
      {l10n("FIELD_SET_AS_STARTING_SCENE")}
    </MenuItem>,
    <MenuSection>
      <div style={{ width: 200 }}>
        <DirectionPicker
          id="startDirection"
          value={sceneId === startSceneId ? startDirection : undefined}
          onChange={(direction) => {
            dispatch(
              settingsActions.editSettings({
                startSceneId: sceneId,
                startDirection: direction,
                startX: hoverX,
                startY: hoverY,
              })
            );
          }}
        />
      </div>
    </MenuSection>,
    ...(onRename
      ? [
          <MenuDivider key="div-direction" />,
          <MenuItem key="rename" onClick={onRename}>
            {l10n("FIELD_RENAME")}
          </MenuItem>,
        ]
      : []),
    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() => dispatch(entitiesActions.removeScene({ sceneId }))}
    >
      {l10n("MENU_DELETE_SCENE")}
    </MenuItem>,
  ];
};

export default renderSceneContextMenu;
