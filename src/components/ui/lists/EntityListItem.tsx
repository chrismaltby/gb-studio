import React, { ReactNode, useCallback, useState } from "react";
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
  PaletteIcon,
  CodeIcon,
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
  rename?: boolean;
  onRename?: (name: string, item: T) => void;
};

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

const EntityInput = styled.input`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  border: 0;
  font-size: 11px;
  margin-left: -5px;
  padding-left: 5px;
  margin-right: 2px;
  border-radius: 4px;
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
  rename,
  onRename,
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

  const [name, setName] = useState(item.name);
  const onRenameBlur = useCallback(() => {
    onRename?.(name, item);
  }, [item, name, onRename]);
  const onRenameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.currentTarget.value);
    },
    []
  );
  const onRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onRename?.(item.name, item);
        setName(item.name);
      } else if (e.key === "Enter") {
        onRename?.(name, item);
      }
    },
    [name, item, onRename]
  );
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
      {rename ? (
        <EntityInput
          autoFocus
          value={name}
          onChange={onRenameChange}
          onKeyDown={onRenameKeyDown}
          onBlur={onRenameBlur}
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
