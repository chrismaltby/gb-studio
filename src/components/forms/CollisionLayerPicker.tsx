import React, { useCallback, useMemo } from "react";
import {useAppSelector } from "store/hooks";
import styled from "styled-components";
import { CollisionSetting } from "shared/lib/resources/types";
import { COLLISIONS_EXTRA_SYMBOLS, defaultCollisionSettings } from "consts";
import { 
  BrushToolbarTileSolidIcon, 
  BrushToolbarTileTopIcon, 
  BrushToolbarTileBottomIcon, 
  BrushToolbarTileLeftIcon, 
  BrushToolbarTileRightIcon, 
  BrushToolbarLadderTileIcon, 
  BrushToolbarTileSlope45RightIcon, 
  BrushToolbarTileSlope45LeftIcon, 
  BrushToolbarTileSlope22RightBottomIcon, 
  BrushToolbarTileSlope22RightTopIcon, 
  BrushToolbarTileSlope22LeftTopIcon, 
  BrushToolbarTileSlope22LeftBottomIcon, 
  BrushToolbarExtraTileIcon 
} from "components/world/BrushToolbarIcons";
import { Input } from "ui/form/RenameInput";
import l10n from "shared/lib/lang/l10n";

const CollisionLayerStyle = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  column-gap: 15px;
  padding: 2px;
`

interface CollisionColorProps {
  $color: string;
}

const ColorInputStyle = styled.input<CollisionColorProps>`
  margin-left: 8px;
  width: 88px;
  height: 32px;
  background-color: ${(props) => props.$color};
  color: black;
  font-weight: bold;
  font-family: monospace;
  font-size: 15px;
  autoFocus=true;
`;

type CollisionLayerPickerProps = {
  onChange: (layer: CollisionSetting) => void;
};

export const CollisionLayerPicker = ({
  onChange
}: CollisionLayerPickerProps) => {

  const settings = useAppSelector((state) => state.project.present.settings);
  
  const collisionSettings = useMemo(
    () => settings.collisionSettings ?? defaultCollisionSettings, 
    [settings.collisionSettings, defaultCollisionSettings]
  );

  return (<div> 
    {collisionSettings.map((layer) => {
      let icon;
      let name = layer.name && layer.name.trim().length > 0 ? layer.name : undefined;
      if (name) icon = <BrushToolbarExtraTileIcon $value={name[0]} $color={layer.color} />;
      else { 
        switch(layer.key) {
          case "solid": 
            name = l10n("FIELD_SOLID");
            icon = <BrushToolbarTileSolidIcon  $color={layer.color} />; 
            break;
          case "top": 
            name = l10n("FIELD_COLLISION_TOP");
            icon = <BrushToolbarTileTopIcon $color={layer.color} />; 
            break;
          case "bottom": 
            name = l10n("FIELD_COLLISION_BOTTOM");
            icon = <BrushToolbarTileBottomIcon $color={layer.color} />; 
            break;
          case "left": 
            name = l10n("FIELD_COLLISION_LEFT");
            icon = <BrushToolbarTileLeftIcon $color={layer.color} />; 
            break;
          case "right": 
            name = l10n("FIELD_COLLISION_RIGHT");
            icon = <BrushToolbarTileRightIcon $color={layer.color} />; 
            break;
          case "ladder": 
            name = l10n("FIELD_LADDER");
            icon = <BrushToolbarLadderTileIcon $color={layer.color} />; 
            break;
          case "slope_45_right": 
            name = l10n("FIELD_COLLISION_SLOPE_45_RIGHT");
            icon = <BrushToolbarTileSlope45RightIcon $color={layer.color} />; 
            break;
          case "slope_45_left": 
            name = l10n("FIELD_COLLISION_SLOPE_45_LEFT");
            icon = <BrushToolbarTileSlope45LeftIcon $color={layer.color} />; 
            break;
          case "slope_22_right_bot": 
            name = l10n("FIELD_COLLISION_SLOPE_22_RIGHT_BOT");
            icon = <BrushToolbarTileSlope22RightBottomIcon $color={layer.color} />; 
            break;
          case "slope_22_right_top": 
            name = l10n("FIELD_COLLISION_SLOPE_22_RIGHT_TOP");
            icon = <BrushToolbarTileSlope22RightTopIcon $color={layer.color} />; 
            break;
          case "slope_22_left_top": 
            name = l10n("FIELD_COLLISION_SLOPE_22_LEFT_TOP");
            icon = <BrushToolbarTileSlope22LeftTopIcon $color={layer.color} />; 
            break;
          case "slope_22_left_bot": 
            name = l10n("FIELD_COLLISION_SLOPE_22_LEFT_BOT");
            icon = <BrushToolbarTileSlope22LeftBottomIcon $color={layer.color} />; 
            break;
          case "spare_08": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 8 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[0]} $color={layer.color} />; 
            break;
          case "spare_09": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 9 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[1]} $color={layer.color} />; 
            break;
          case "spare_10": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 10 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[2]} $color={layer.color} />; 
            break;
          case "spare_11": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 11 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[3]} $color={layer.color} />; 
            break;
          case "spare_12": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 12 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[4]} $color={layer.color} />; 
            break;
          case "spare_13": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 13 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[5]} $color={layer.color} />; 
            break;
          case "spare_14": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 14 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[6]} $color={layer.color} />; 
            break;
          case "spare_15": 
            name = l10n("FIELD_COLLISION_SPARE", { tile: 15 });
            icon = <BrushToolbarExtraTileIcon $value={COLLISIONS_EXTRA_SYMBOLS[7]} $color={layer.color} />; 
            break;
          default: icon = <div/>;
        }
      }

      return (<CollisionLayerStyle>
        {icon}
        <Input
          id={layer.key+".name"}
          value={layer.name}
          placeholder={name}
          onChange={(e) => {
            onChange({
              key: layer.key,
              name: e.currentTarget.value,
              icon: layer.icon,
              color: layer.color
            });
          }}
        />
        <ColorInputStyle
          $color={layer.color}
          id={layer.key+".color"}
          value={layer.color}
          placeholder="#000000FF"
          onChange={(e) => {
            onChange({
              key: layer.key,
              name: layer.name,
              color: e.currentTarget.value,
              icon: layer.icon
            });
          }}
        />
      </CollisionLayerStyle>)
    })}
  </div>);
  
  
};
