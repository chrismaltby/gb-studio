import React from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { CollisionTileLabel } from "shared/lib/resources/types";
import { COLLISIONS_EXTRA_SYMBOLS } from "consts";
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
  value: CollisionTileLabel;
  onChange: (newValue: CollisionTileLabel) => void;
}

const CollisionTileLabelPicker = ({
  value,
  onChange,
}: CollisionTileLabelPicker) => {
  
  const icon = getTileIcon(value);
  const name = value.name && value.name.trim().length > 0 ? l10n(value.name as L10NKey) : undefined;

  return (
    <StyledCollisionTileLabelPicker>
      <StyledCollisionTileIcon>{icon}</StyledCollisionTileIcon>
      <Input
        id={value.key + ".name"}
        value={value.name ?? ""}
        placeholder={name}
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
        placeholder="#000000FF"
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
      {collisionTileLabels.map((layer) => (
        <CollisionTileLabelPicker
          key={layer.key}
          value={layer}
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
