import React, { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { CollisionTileLabel } from "shared/lib/resources/types";
import { COLLISIONS_EXTRA_SYMBOLS, defaultCollisionTileLabels } from "consts";
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
  BrushToolbarExtraTileIcon,
} from "components/world/BrushToolbarIcons";
import { Input } from "ui/form/Input";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import settingsActions from "store/features/settings/settingsActions";
import { StyledInput } from "ui/form/style";
import { getTileIcon } from "components/world/BrushToolbar";

const StyledCollisionTileLabelsPicker = styled.div`
  display: grid;
  grid-template-columns: auto;
  grid-gap: 5px 20px;
`;

const StyledCollisionTileLabelPicker = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  column-gap: 5px;

  ${StyledInput} {
    flex-grow: 1;
  }
`;

const StyledCollisionTileIcon = styled.div`
  flex-shrink: 0;
  display: flex;
  height: 28px;
  align-items: center;
`;

const StyledMaskInput = styled.input`
  width: 60px;
  height: 28px;
  font-weight: bold;
  font-family: monospace;
  font-size: 12px;
  padding: 0;
`;

interface CollisionColorProps {
  $color: string;
}

const StyledColorInput = styled.input<CollisionColorProps>`
  width: 88px;
  height: 28px;
  font-weight: bold;
  font-family: monospace;
  font-size: 15px;
  -webkit-appearance: none;
  padding: 0;

  background: ${(props) => props.$color};
  color: black;
  border: 1px solid ${(props) => props.theme.colors.input.border};
  border-radius: ${(props) => props.theme.borderRadius}px;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  &::-webkit-color-swatch {
    border: none;
    border-radius: ${(props) => props.theme.borderRadius - 1}px;
  }
`;

interface CollisionTileLabelPicker {
  index: number;
  value: CollisionTileLabel;
  onChange: (newValue: CollisionTileLabel) => void;
}

const CollisionTileLabelPicker = ({
  index,
  value,
  onChange,
}: CollisionTileLabelPicker) => {

  const defaultTile = defaultCollisionTileLabels.find(tile => tile.key == value.key);
  const defaultName = (defaultTile && defaultTile.name) ? defaultTile.name : "";

  const name = value.name && value.name.length > 0 && value.name != defaultName ? value.name : "";
  const icon = getTileIcon(value);

  const getMaskFlags = () => {
    const flag = ("00000000" + value.flag.toString(2)).slice(-8);
    const mask = value.mask ? ("00000000" + value.mask.toString(2)).slice(-8) : flag;
    return Array.from(mask).map((b, i) => b === "0" ? "x" : flag[i]).join("");
  };

  const getMask = (maskFlags: string) => {
    if (maskFlags.length != 8) return value.mask;
    return Number("0b"+Array.from(maskFlags).map((b, i) => b === "x" ? "0" : "1").join(""));
  }

  const getFlag = (maskFlags: string) => {
    if (maskFlags.length != 8) return value.flag;
    return Number("0b"+Array.from(maskFlags).map((b, i) => b === "x" ? "0" : b).join(""));
  }

  return (
    <StyledCollisionTileLabelPicker>
      <StyledCollisionTileIcon>{icon}</StyledCollisionTileIcon>
      <Input
        id={value.key + ".name"}
        value={name}
        placeholder={l10n(defaultName as L10NKey, {tile:index})}
        onChange={(e) => {
          onChange({
            key: value.key,
            name: e.currentTarget.value,
            icon: value.icon,
            color: value.color,
            flag: value.flag,
            mask: value.mask
          });
        }}
      />
      <StyledColorInput
        // type="color" //truncates alpha value
        $color={value.color}
        id={value.key + ".color"}
        value={value.color}
        style={{}}
        onChange={(e) => {
          onChange({
            key: value.key,
            name: value.name,
            color: e.currentTarget.value,
            icon: value.icon,
            flag: value.flag,
            mask: value.mask
          });
        }}
      />
      <StyledMaskInput
        id={value.key + ".mask"}
        value={getMaskFlags()}
        onChange={(e) => {
          onChange({
            key: value.key,
            name: value.name,
            icon: value.icon,
            color: value.color,
            flag: getFlag(e.currentTarget.value),
            mask: getMask(e.currentTarget.value)
          });
        }}
      />
    </StyledCollisionTileLabelPicker>
  );
};

export const CollisionTileLabelsPicker = () => {
  const dispatch = useAppDispatch();
  const collisionTileLabels = useAppSelector(
    (state) => state.project.present.settings.collisionTileLabels
  );

  return (
    <StyledCollisionTileLabelsPicker>
      {collisionTileLabels.map((label, index) => (
        <CollisionTileLabelPicker
          key={label.key}
          index={index}
          value={label}
          onChange={(newValue) => {
            const newCollisionTileLabels = collisionTileLabels.map((t) =>
              t.key === newValue.key ? newValue : t
            );
            dispatch(
              settingsActions.editSettings({
                collisionTileLabels: newCollisionTileLabels,
              })
            );
          }}
        />
      ))}
    </StyledCollisionTileLabelsPicker>
  );
};
