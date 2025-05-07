import DirectionPicker from "components/forms/DirectionPicker";
import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import {
  ActorDirection,
  SceneNormalized,
} from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ColorModeOverrideSetting } from "shared/lib/resources/types";
import buildGameActions from "store/features/buildGame/buildGameActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import { LabelButton } from "ui/buttons/LabelButton";
import { BlankIcon, CheckIcon } from "ui/icons/Icons";
import { MenuDivider, MenuItem, MenuSection } from "ui/menu/Menu";

interface SceneContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  sceneId: string;
  additionalSceneIds: string[];
  startSceneId: string;
  startDirection: ActorDirection;
  hoverX: number;
  hoverY: number;
  runSceneSelectionOnly: boolean;
  colorModeOverride: ColorModeOverrideSetting;
  colorsEnabled: boolean;
  onRename?: () => void;
  onClose?: () => void;
}

const renderSceneContextMenu = ({
  sceneId,
  additionalSceneIds,
  colorsEnabled,
  colorModeOverride,
  onRename,
  dispatch,
  startSceneId,
  startDirection,
  hoverX,
  hoverY,
  runSceneSelectionOnly,
  onClose,
}: SceneContextMenuProps) => {
  const editSelectedScenes = (changes: Partial<SceneNormalized>) => {
    dispatch(
      additionalSceneIds.length > 1
        ? entitiesActions.editScenes(
            additionalSceneIds.map((id) => ({
              id,
              changes,
            }))
          )
        : entitiesActions.editScene({
            sceneId,
            changes,
          })
    );
  };

  return [
    <MenuSection key="label" style={{ paddingRight: 10, marginBottom: 5 }}>
      <div style={{ display: "flex" }}>
        <div style={{ marginRight: 5 }}>
          <LabelButton
            onClick={() =>
              editSelectedScenes({
                labelColor: "",
              })
            }
          />
        </div>
        {["red", "orange", "yellow", "green", "blue", "purple", "gray"].map(
          (color) => (
            <div key={color} style={{ marginRight: color === "gray" ? 0 : 5 }}>
              <LabelButton
                color={color}
                onClick={() => {
                  editSelectedScenes({ labelColor: color });
                  onClose?.();
                }}
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
    <MenuSection key="direction">
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
            onClose?.();
          }}
        />
      </div>
    </MenuSection>,
    <MenuDivider key="div-preview" />,
    <MenuItem
      key="preview"
      subMenu={[
        <MenuItem
          key="preview-here"
          icon={<BlankIcon />}
          onClick={() =>
            dispatch(
              buildGameActions.buildGame({
                startSceneId: sceneId,
                startX: hoverX,
                startY: hoverY,
              })
            )
          }
        >
          {l10n("FIELD_RUN_FROM_HERE")}
        </MenuItem>,
        <MenuDivider key="div-preview-sub" />,
        <MenuItem
          key="preview-selection"
          icon={runSceneSelectionOnly ? <CheckIcon /> : <BlankIcon />}
          onClick={() => {
            dispatch(
              settingsActions.editSettings({
                runSceneSelectionOnly: !runSceneSelectionOnly,
              })
            );
          }}
        >
          {l10n("FIELD_INCLUDE_SELECTION_ONLY")}
        </MenuItem>,
      ]}
    >
      {l10n("FIELD_RUN_SCENE")}
    </MenuItem>,
    ...(onRename || colorsEnabled ? [<MenuDivider key="div-rename" />] : []),
    ...(onRename
      ? [
          <MenuItem key="rename" onClick={onRename}>
            {l10n("FIELD_RENAME")}
          </MenuItem>,
        ]
      : []),
    ...(colorsEnabled
      ? [
          <MenuItem
            key="colorModeOverride"
            subMenu={[
              <MenuItem
                key="colorModeOverride-none"
                icon={
                  colorModeOverride === "none" ? <CheckIcon /> : <BlankIcon />
                }
                onClick={() =>
                  editSelectedScenes({ colorModeOverride: "none" })
                }
              >
                {l10n("FIELD_NONE")}
              </MenuItem>,
              <MenuDivider key="div-colorModeOverride-sub" />,
              <MenuItem
                key="colorModeOverride-mixed"
                icon={
                  colorModeOverride === "mixed" ? <CheckIcon /> : <BlankIcon />
                }
                onClick={() =>
                  editSelectedScenes({ colorModeOverride: "mixed" })
                }
              >
                {l10n("FIELD_COLOR_MODE_COLOR_MONO")}
              </MenuItem>,

              <MenuItem
                key="colorModeOverride-color"
                icon={
                  colorModeOverride === "color" ? <CheckIcon /> : <BlankIcon />
                }
                onClick={() =>
                  editSelectedScenes({ colorModeOverride: "color" })
                }
              >
                {l10n("FIELD_COLOR_MODE_COLOR_ONLY")}
              </MenuItem>,
            ]}
          >
            {l10n("FIELD_COLOR_MODE_OVERRIDE")}
          </MenuItem>,
        ]
      : []),
    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() =>
        additionalSceneIds.length > 1
          ? dispatch(
              entitiesActions.removeScenes({ sceneIds: additionalSceneIds })
            )
          : dispatch(entitiesActions.removeScene({ sceneId }))
      }
    >
      {l10n(
        additionalSceneIds.length > 1
          ? "MENU_DELETE_SCENES"
          : "MENU_DELETE_SCENE"
      )}
    </MenuItem>,
  ];
};

export default renderSceneContextMenu;
