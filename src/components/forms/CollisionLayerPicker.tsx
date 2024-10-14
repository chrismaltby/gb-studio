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
  const layerColor = useMemo(()=> layer.color, [layer.color]);
  const valueText = useMemo(()=> layer.name, [layer.name])

  const spareSymbols = useMemo(
    () => ["08","09","10","11","12","13","14","15"].map(i => {
      const setting = collisionSettings.find(s => s.key == ("spare_"+i));
      return COLLISIONS_EXTRA_SYMBOLS[+i-8];
    }),
    [collisionSettings]
  );

  const collisionIcon = useMemo(()=> {
    if (layer && layer.name) return <BrushToolbarExtraTileIcon $value={layer.name[0]} $color={layerColor} />;
    switch(layer.key) {
      case "solid": return <BrushToolbarTileSolidIcon  $color={layerColor} />;
      case "top": return <BrushToolbarTileTopIcon $color={layerColor} />;
      case "bottom": return <BrushToolbarTileBottomIcon $color={layerColor} />;
      case "left": return <BrushToolbarTileLeftIcon $color={layerColor} />;
      case "right": return <BrushToolbarTileRightIcon $color={layerColor} />;
      case "ladder": return <BrushToolbarLadderTileIcon $color={layerColor} />;
      case "slope_45_right": return <BrushToolbarTileSlope45RightIcon $color={layerColor} />;
      case "slope_45_left": return <BrushToolbarTileSlope45LeftIcon $color={layerColor} />;
      case "slope_22_right_bot": return <BrushToolbarTileSlope22RightBottomIcon $color={layerColor} />;
      case "slope_22_right_top": return <BrushToolbarTileSlope22RightTopIcon $color={layerColor} />;
      case "slope_22_left_top": return <BrushToolbarTileSlope22LeftTopIcon $color={layerColor} />;
      case "slope_22_left_bot": return <BrushToolbarTileSlope22LeftBottomIcon $color={layerColor} />;
      case "spare_08": return <BrushToolbarExtraTileIcon $value={spareSymbols[0]} $color={layerColor} />;
      case "spare_09": return <BrushToolbarExtraTileIcon $value={spareSymbols[1]} $color={layerColor} />;
      case "spare_10": return <BrushToolbarExtraTileIcon $value={spareSymbols[2]} $color={layerColor} />;
      case "spare_11": return <BrushToolbarExtraTileIcon $value={spareSymbols[3]} $color={layerColor} />;
      case "spare_12": return <BrushToolbarExtraTileIcon $value={spareSymbols[4]} $color={layerColor} />;
      case "spare_13": return <BrushToolbarExtraTileIcon $value={spareSymbols[5]} $color={layerColor} />;
      case "spare_14": return <BrushToolbarExtraTileIcon $value={spareSymbols[6]} $color={layerColor} />;
      case "spare_15": return <BrushToolbarExtraTileIcon $value={spareSymbols[7]} $color={layerColor} />;
      default: return <div/>;
    }}, [layer.key, layerColor]
  );

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
      id={layer.key+".name"}
      value={valueText}
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
