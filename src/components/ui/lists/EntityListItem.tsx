import React, { ReactNode, useCallback, useState } from "react";
import styled from "styled-components";
import { RenameInput } from "ui/form/RenameInput";
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
  BackgroundIcon,
  PaletteIcon,
  CodeIcon,
  SoundIcon,
  FolderFilledIcon,
  SceneIcon,
} from "ui/icons/Icons";
import { ContextMenu } from "ui/menu/ContextMenu";

interface EntityListItemWrapperProps {
  nestLevel?: number;
}

type EntityListItemData = {
  name: string;
  labelColor?: string;
  warning?: string;
};

type EntityListItemProps<T extends EntityListItemData> = {
  item: T;
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
    | "sound"
    | "song"
    | "duty"
    | "wave"
    | "noise"
    | "palette"
    | "script";
  icon?: ReactNode;
  nestLevel?: number;
  collapsed?: boolean;
  collapsable?: boolean;
  onToggleCollapse?: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  renderContextMenu?: (item: T) => JSX.Element[] | undefined;
  renderLabel?: (item: T) => React.ReactNode;
} & (
  | {
      rename: true;
      onRename: (name: string, item: T) => void;
      onRenameCancel: (item: T) => void;
    }
  | {
      rename?: false;
    }
);

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

const EntityListItemWrapper = styled.div<EntityListItemWrapperProps>`
  display: flex;
  align-items: center;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  padding-left: ${(props) => (props.nestLevel || 0) * 15}px;
`;

const EntityIcon = styled.div`
  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 10px;
    height: 10px;
    margin-right: 5px;
    opacity: 0.5;
  }
`;

const EntityLabel = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
`;

const EntityWarningLabel = styled.span`
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

export const EntityListSearch = styled.input`
  margin: 5px 5px;
  flex-grow: 1;
  width: calc(100% - 10px);
  border-radius: 32px;
  color: ${(props) => props.theme.colors.text};
  background: ${(props) => props.theme.colors.sidebar.background};
  border: 1px solid transparent;
  font-size: 11px;
  padding: 2px 5px;

  &:not(:placeholder-shown) {
    background: ${(props) => props.theme.colors.input.background};
    border: 1px solid ${(props) => props.theme.colors.input.border};
  }
`;

export const EntityListItem = <T extends EntityListItemData>({
  item,
  type,
  icon,
  nestLevel,
  collapsable,
  collapsed,
  onToggleCollapse,
  renderContextMenu,
  renderLabel,
  ...props
}: EntityListItemProps<T>) => {
  const [contextMenu, setContextMenu] =
    useState<{
      x: number;
      y: number;
      menu: JSX.Element[];
    }>();
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!renderContextMenu) {
        return;
      }
      const menu = renderContextMenu(item);
      if (!menu) {
        return;
      }
      setContextMenu({ x: e.pageX, y: e.pageY, menu });
    },
    [item, renderContextMenu]
  );
  const onContextMenuClose = useCallback(() => {
    setContextMenu(undefined);
  }, []);

  const onRenameComplete = useCallback(
    (newValue: string) => {
      if (props.rename) {
        props.onRename(newValue, item);
      }
    },
    [item, props]
  );
  const onRenameCancel = useCallback(() => {
    if (props.rename) {
      props.onRenameCancel(item);
    }
  }, [item, props]);

  return (
    <EntityListItemWrapper nestLevel={nestLevel} onContextMenu={onContextMenu}>
      {collapsable && (
        <NavigatorArrow open={!collapsed} onClick={() => onToggleCollapse?.()}>
          <ArrowIcon />
        </NavigatorArrow>
      )}
      {type === "custom" && icon && <EntityIcon>{icon}</EntityIcon>}
      {type === "folder" && (
        <EntityIcon>
          <FolderFilledIcon />
        </EntityIcon>
      )}
      {type === "scene" && (
        <EntityIcon>
          <SceneIcon />
        </EntityIcon>
      )}
      {type === "actor" && (
        <EntityIcon>
          <ActorIcon />
        </EntityIcon>
      )}
      {type === "trigger" && (
        <EntityIcon>
          <TriggerIcon />
        </EntityIcon>
      )}
      {type === "variable" && (
        <EntityIcon>
          <VariableIcon />
        </EntityIcon>
      )}
      {type === "sprite" && (
        <EntityIcon>
          <SpriteIcon />
        </EntityIcon>
      )}
      {type === "animation" && (
        <EntityIcon>
          <AnimationIcon />
        </EntityIcon>
      )}
      {type === "background" && (
        <EntityIcon>
          <BackgroundIcon />
        </EntityIcon>
      )}
      {type === "song" && (
        <EntityIcon>
          <SongIcon />
        </EntityIcon>
      )}
      {type === "duty" && (
        <EntityIcon>
          <DutyIcon />
        </EntityIcon>
      )}
      {type === "wave" && (
        <EntityIcon>
          <WaveIcon />
        </EntityIcon>
      )}
      {type === "noise" && (
        <EntityIcon>
          <NoiseIcon />
        </EntityIcon>
      )}
      {type === "palette" && (
        <EntityIcon>
          <PaletteIcon />
        </EntityIcon>
      )}
      {type === "script" && (
        <EntityIcon>
          <CodeIcon />
        </EntityIcon>
      )}
      {type === "sound" && (
        <EntityIcon>
          <SoundIcon />
        </EntityIcon>
      )}
      {props.rename ? (
        <RenameInput
          autoFocus
          value={item.name}
          onRenameComplete={onRenameComplete}
          onRenameCancel={onRenameCancel}
        />
      ) : (
        <EntityLabel>
          {renderLabel ? renderLabel(item) : item.name}
          {item.warning && (
            <EntityWarningLabel> ({item.warning})</EntityWarningLabel>
          )}
        </EntityLabel>
      )}
      {item.labelColor && <EntityLabelColor color={item.labelColor} />}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={onContextMenuClose}
        >
          {contextMenu.menu}
        </ContextMenu>
      )}
    </EntityListItemWrapper>
  );
};
