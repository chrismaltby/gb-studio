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
import {
  StyledEntityIcon,
  StyledEntityLabel,
  StyledEntityLabelColor,
  StyledEntityListItem,
  StyledEntityWarningLabel,
  StyledNavigatorArrow,
} from "ui/lists/style";
import { ContextMenu } from "ui/menu/ContextMenu";

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
    <StyledEntityListItem $nestLevel={nestLevel} onContextMenu={onContextMenu}>
      {collapsable && (
        <StyledNavigatorArrow
          $open={!collapsed}
          onClick={() => onToggleCollapse?.()}
        >
          <ArrowIcon />
        </StyledNavigatorArrow>
      )}
      {type === "custom" && icon && <StyledEntityIcon>{icon}</StyledEntityIcon>}
      {type === "folder" && (
        <StyledEntityIcon>
          <FolderFilledIcon />
        </StyledEntityIcon>
      )}
      {type === "scene" && (
        <StyledEntityIcon>
          <SceneIcon />
        </StyledEntityIcon>
      )}
      {type === "actor" && (
        <StyledEntityIcon>
          <ActorIcon />
        </StyledEntityIcon>
      )}
      {type === "trigger" && (
        <StyledEntityIcon>
          <TriggerIcon />
        </StyledEntityIcon>
      )}
      {type === "variable" && (
        <StyledEntityIcon>
          <VariableIcon />
        </StyledEntityIcon>
      )}
      {type === "sprite" && (
        <StyledEntityIcon>
          <SpriteIcon />
        </StyledEntityIcon>
      )}
      {type === "animation" && (
        <StyledEntityIcon>
          <AnimationIcon />
        </StyledEntityIcon>
      )}
      {type === "background" && (
        <StyledEntityIcon>
          <BackgroundIcon />
        </StyledEntityIcon>
      )}
      {type === "song" && (
        <StyledEntityIcon>
          <SongIcon />
        </StyledEntityIcon>
      )}
      {type === "duty" && (
        <StyledEntityIcon>
          <DutyIcon />
        </StyledEntityIcon>
      )}
      {type === "wave" && (
        <StyledEntityIcon>
          <WaveIcon />
        </StyledEntityIcon>
      )}
      {type === "noise" && (
        <StyledEntityIcon>
          <NoiseIcon />
        </StyledEntityIcon>
      )}
      {type === "palette" && (
        <StyledEntityIcon>
          <PaletteIcon />
        </StyledEntityIcon>
      )}
      {type === "script" && (
        <StyledEntityIcon>
          <CodeIcon />
        </StyledEntityIcon>
      )}
      {type === "sound" && (
        <StyledEntityIcon>
          <SoundIcon />
        </StyledEntityIcon>
      )}
      {props.rename ? (
        <RenameInput
          autoFocus
          value={item.name}
          onRenameComplete={onRenameComplete}
          onRenameCancel={onRenameCancel}
        />
      ) : (
        <StyledEntityLabel>
          {renderLabel ? renderLabel(item) : item.name}
          {item.warning && (
            <StyledEntityWarningLabel>
              ({item.warning})
            </StyledEntityWarningLabel>
          )}
        </StyledEntityLabel>
      )}
      {item.labelColor && <StyledEntityLabelColor $color={item.labelColor} />}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={onContextMenuClose}
        >
          {contextMenu.menu}
        </ContextMenu>
      )}
    </StyledEntityListItem>
  );
};
