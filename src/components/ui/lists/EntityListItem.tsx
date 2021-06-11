import React, { FC, ReactNode } from "react";
import styled from "styled-components";
import {
  ActorIcon,
  AnimationIcon,
  ArrowIcon,
  SpriteIcon,
  TriggerIcon,
  VariableIcon,
  NoiseIcon,
  DutyIcon,
  WaveIcon,
  SongIcon,
  FolderFilledIcon,
  BackgroundIcon,
} from "../icons/Icons";

interface EntityListItemWrapperProps {
  nestLevel?: number;
}

interface EntityListItemProps {
  item: {
    name: string;
    labelColor?: string;
    warning?: string;
  };
  type:
    | "custom"
    | "folder"
    | "scene"
    | "actor"
    | "trigger"
    | "variable"
    | "sprite"
    | "animation"
    | "state"
    | "background"
    | "song"
    | "duty"
    | "wave"
    | "noise";
  icon?: ReactNode;
  nestLevel?: number;
  collapsed?: boolean;
  collapsable?: boolean;
  onToggleCollapse?: () => void;
}

interface NavigatorArrowProps {
  open: boolean;
}

interface EntityLabelColorProps {
  color: string;
}

const NavigatorArrow = styled.span<NavigatorArrowProps>`
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  margin-left: -5px;

  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 8px;
    height: 8px;
    transform: rotate(${(props) => (props.open ? 90 : 0)}deg);
  }
`;

const EnitityListItem = styled.div<EntityListItemWrapperProps>`
  display: flex;
  align-items: center;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  padding-left: ${(props) => (props.nestLevel || 0) * 15}px;
`;

const EnitityIcon = styled.div`
  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 10px;
    height: 10px;
    margin-right: 5px;
    opacity: 0.5;
  }
`;

const EnitityLabel = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
`;

const EnitityWarningLabel = styled.span`
  color: red;
`;

const EntityLabelColor = styled.div.attrs<EntityLabelColorProps>((props) => ({
  className: `label--${props.color}`,
}))`
  width: 10px;
  height: 10px;
  border-radius: 10px;
  flex-shrink: 0;
  margin-left: 5px;
`;

export const EntityListItem: FC<EntityListItemProps> = ({
  item,
  type,
  icon,
  nestLevel,
  collapsable,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <EnitityListItem nestLevel={nestLevel}>
      {collapsable && (
        <NavigatorArrow open={!collapsed} onClick={() => onToggleCollapse?.()}>
          <ArrowIcon />
        </NavigatorArrow>
      )}
      {type === "custom" && icon && <EnitityIcon>{icon}</EnitityIcon>}
      {type === "folder" && (
        <EnitityIcon>
          <FolderFilledIcon />
        </EnitityIcon>
      )}
      {type === "actor" && (
        <EnitityIcon>
          <ActorIcon />
        </EnitityIcon>
      )}
      {type === "trigger" && (
        <EnitityIcon>
          <TriggerIcon />
        </EnitityIcon>
      )}
      {type === "variable" && (
        <EnitityIcon>
          <VariableIcon />
        </EnitityIcon>
      )}
      {type === "sprite" && (
        <EnitityIcon>
          <SpriteIcon />
        </EnitityIcon>
      )}
      {type === "animation" && (
        <EnitityIcon>
          <AnimationIcon />
        </EnitityIcon>
      )}
      {type === "background" && (
        <EnitityIcon>
          <BackgroundIcon />
        </EnitityIcon>
      )}
      {type === "song" && (
        <EnitityIcon>
          <SongIcon />
        </EnitityIcon>
      )}
      {type === "duty" && (
        <EnitityIcon>
          <DutyIcon />
        </EnitityIcon>
      )}
      {type === "wave" && (
        <EnitityIcon>
          <WaveIcon />
        </EnitityIcon>
      )}
      {type === "noise" && (
        <EnitityIcon>
          <NoiseIcon />
        </EnitityIcon>
      )}
      <EnitityLabel>
        {item.name}{" "}
        {item.warning && (
          <EnitityWarningLabel> ({item.warning})</EnitityWarningLabel>
        )}
      </EnitityLabel>
      {item.labelColor && <EntityLabelColor color={item.labelColor} />}
    </EnitityListItem>
  );
};
