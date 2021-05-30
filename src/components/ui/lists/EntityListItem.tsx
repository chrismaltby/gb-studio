import React, { FC } from "react";
import styled from "styled-components";
import {
  ActorIcon,
  ArrowIcon,
  TriggerIcon,
  VariableIcon,
} from "../icons/Icons";

interface EntityListItemWrapperProps {
  nestLevel?: number;
}

interface EntityListItemProps {
  item: {
    name: string;
    labelColor?: string;
  };
  type: "scene" | "actor" | "trigger" | "variable";
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
      <EnitityLabel>{item.name}</EnitityLabel>
      {item.labelColor && <EntityLabelColor color={item.labelColor} />}
    </EnitityListItem>
  );
};
