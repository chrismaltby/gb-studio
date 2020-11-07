import React, { FC } from "react";
import styled from "styled-components";
import { ActorIcon, ArrowIcon, TriggerIcon } from "../icons/Icons";

interface EntityListItemWrapperProps {
  nestLevel?: number;
}

interface EntityListItemProps {
  item: {
    name: string;
  };
  type: "scene" | "actor" | "trigger";
  nestLevel?: number;
  collapsed?: boolean;
  collapsable?: boolean;
  onToggleCollapse?: () => void;
}

interface NavigatorArrowProps {
  open: boolean;
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
  padding-left: ${(props) => (props.nestLevel || 0) * 15}px;
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
      {type === "actor" && <ActorIcon />}
      {type === "trigger" && <TriggerIcon />}
      <EnitityLabel>{item.name}</EnitityLabel>
    </EnitityListItem>
  );
};
