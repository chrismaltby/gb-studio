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

type CollisionLayerPickerProps = {
  name: string,
  layer: CollisionSetting
  onChange: (layer: CollisionSetting) => void;
};

export const CollisionLayerPicker = ({
  name, 
  layer,
  onChange
}: CollisionLayerPickerProps) => {

  const collisionSettings = useAppSelector((state) => state.project.present.settings.collisionSettings ?? defaultCollisionSettings);
  const spareSymbols = useMemo(
    () => ["08","09","10","11","12","13","14","15"].map(i => {
      const setting = collisionSettings.find(s => s.key == ("spare_"+i));
      return setting && setting.icon ? setting.icon[0] : COLLISIONS_EXTRA_SYMBOLS[+i-8];
    }),
    [collisionSettings]
  );
  const collisionIcon = useMemo(()=> {
    switch(layer.key) {
      case "solid": return <BrushToolbarTileSolidIcon  $color={layer.color} />;
      case "top": return <BrushToolbarTileTopIcon $color={layer.color} />;
      case "bottom": return <BrushToolbarTileBottomIcon $color={layer.color} />;
      case "left": return <BrushToolbarTileLeftIcon $color={layer.color} />;
      case "right": return <BrushToolbarTileRightIcon $color={layer.color} />;
      case "ladder": return <BrushToolbarLadderTileIcon $color={layer.color} />;
      case "slope_45_right": return <BrushToolbarTileSlope45RightIcon $color={layer.color} />;
      case "slope_45_left": return <BrushToolbarTileSlope45LeftIcon $color={layer.color} />;
      case "slope_22_right_bot": return <BrushToolbarTileSlope22RightBottomIcon $color={layer.color} />;
      case "slope_22_right_top": return <BrushToolbarTileSlope22RightTopIcon $color={layer.color} />;
      case "slope_22_left_top": return <BrushToolbarTileSlope22LeftTopIcon $color={layer.color} />;
      case "slope_22_left_bot": return <BrushToolbarTileSlope22LeftBottomIcon $color={layer.color} />;
      case "spare_08": return <BrushToolbarExtraTileIcon $value={spareSymbols[0]} $color={layer.color} />;
      case "spare_09": return <BrushToolbarExtraTileIcon $value={spareSymbols[1]} $color={layer.color} />;
      case "spare_10": return <BrushToolbarExtraTileIcon $value={spareSymbols[2]} $color={layer.color} />;
      case "spare_11": return <BrushToolbarExtraTileIcon $value={spareSymbols[3]} $color={layer.color} />;
      case "spare_12": return <BrushToolbarExtraTileIcon $value={spareSymbols[4]} $color={layer.color} />;
      case "spare_13": return <BrushToolbarExtraTileIcon $value={spareSymbols[5]} $color={layer.color} />;
      case "spare_14": return <BrushToolbarExtraTileIcon $value={spareSymbols[6]} $color={layer.color} />;
      case "spare_15": return <BrushToolbarExtraTileIcon $value={spareSymbols[7]} $color={layer.color} />;
      default: return <div/>;
    }}, [layer]
  );

  const layerColor = useMemo(()=> layer.color, [layer]);

  const CollisionLayerStyle = styled.div`
    display: flex;
    width: 100%;
    box-sizing: border-box;
    column-gap: 15px;
    padding: 2px;
  `

  const ColorInputStyle = styled.input`
    margin-left: 8px;
    width: 64px;
    height: 32px;
    background-color: ${layerColor};
    color: black;
    font-size: 12px;
  `

  return (<CollisionLayerStyle>
    {collisionIcon}
    <Input
      id={layer.key}
      value={layer.name}
      placeholder={name}
      onChange={(e) => {
        onChange({
          key: layer.key,
          name: e.currentTarget.value,
          icon: layer.icon,
          color: layerColor
        });
      }}
    />
    <ColorInputStyle
      id={layer.key+".color"}
      value={layerColor}
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
  </CollisionLayerStyle>);
};
