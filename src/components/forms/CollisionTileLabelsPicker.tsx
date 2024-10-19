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
import l10n from "shared/lib/lang/l10n";
import settingsActions from "store/features/settings/settingsActions";
import { StyledInput } from "ui/form/style";

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
  let icon;
  let name =
    value.name && value.name.trim().length > 0 ? value.name : undefined;
  if (name)
    icon = <BrushToolbarExtraTileIcon $value={name[0]} $color={value.color} />;
  else {
    switch (value.key) {
      case "solid":
        name = l10n("FIELD_SOLID");
        icon = <BrushToolbarTileSolidIcon $color={value.color} />;
        break;
      case "top":
        name = l10n("FIELD_COLLISION_TOP");
        icon = <BrushToolbarTileTopIcon $color={value.color} />;
        break;
      case "bottom":
        name = l10n("FIELD_COLLISION_BOTTOM");
        icon = <BrushToolbarTileBottomIcon $color={value.color} />;
        break;
      case "left":
        name = l10n("FIELD_COLLISION_LEFT");
        icon = <BrushToolbarTileLeftIcon $color={value.color} />;
        break;
      case "right":
        name = l10n("FIELD_COLLISION_RIGHT");
        icon = <BrushToolbarTileRightIcon $color={value.color} />;
        break;
      case "ladder":
        name = l10n("FIELD_LADDER");
        icon = <BrushToolbarLadderTileIcon $color={value.color} />;
        break;
      case "slope_45_right":
        name = l10n("FIELD_COLLISION_SLOPE_45_RIGHT");
        icon = <BrushToolbarTileSlope45RightIcon $color={value.color} />;
        break;
      case "slope_45_left":
        name = l10n("FIELD_COLLISION_SLOPE_45_LEFT");
        icon = <BrushToolbarTileSlope45LeftIcon $color={value.color} />;
        break;
      case "slope_22_right_bot":
        name = l10n("FIELD_COLLISION_SLOPE_22_RIGHT_BOT");
        icon = <BrushToolbarTileSlope22RightBottomIcon $color={value.color} />;
        break;
      case "slope_22_right_top":
        name = l10n("FIELD_COLLISION_SLOPE_22_RIGHT_TOP");
        icon = <BrushToolbarTileSlope22RightTopIcon $color={value.color} />;
        break;
      case "slope_22_left_top":
        name = l10n("FIELD_COLLISION_SLOPE_22_LEFT_TOP");
        icon = <BrushToolbarTileSlope22LeftTopIcon $color={value.color} />;
        break;
      case "slope_22_left_bot":
        name = l10n("FIELD_COLLISION_SLOPE_22_LEFT_BOT");
        icon = <BrushToolbarTileSlope22LeftBottomIcon $color={value.color} />;
        break;
      case "spare_08":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 8 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[0]}
            $color={value.color}
          />
        );
        break;
      case "spare_09":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 9 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[1]}
            $color={value.color}
          />
        );
        break;
      case "spare_10":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 10 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[2]}
            $color={value.color}
          />
        );
        break;
      case "spare_11":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 11 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[3]}
            $color={value.color}
          />
        );
        break;
      case "spare_12":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 12 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[4]}
            $color={value.color}
          />
        );
        break;
      case "spare_13":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 13 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[5]}
            $color={value.color}
          />
        );
        break;
      case "spare_14":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 14 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[6]}
            $color={value.color}
          />
        );
        break;
      case "spare_15":
        name = l10n("FIELD_COLLISION_SPARE", { tile: 15 });
        icon = (
          <BrushToolbarExtraTileIcon
            $value={COLLISIONS_EXTRA_SYMBOLS[7]}
            $color={value.color}
          />
        );
        break;
      default:
        icon = <div />;
    }
  }

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
