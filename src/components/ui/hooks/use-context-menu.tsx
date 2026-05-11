import React, {
  JSX,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MaybePromise } from "shared/types";
import { ContextMenu } from "ui/menu/ContextMenu";

const CLOSE_CONTEXT_MENUS_EVENT = "close-context-menus";

const closeAllContextMenus = () => {
  window.dispatchEvent(new Event(CLOSE_CONTEXT_MENUS_EVENT));
};

interface ContextMenuState {
  x: number;
  y: number;
  menu: JSX.Element[];
}

interface UseContextMenuOptions {
  enabled?: boolean;
  getIsEnabled?: (e: React.MouseEvent) => boolean;
  getMenu: (args: {
    closeMenu: () => void;
    event: React.MouseEvent;
  }) => MaybePromise<JSX.Element[] | undefined>;
}

interface UseContextMenuResult {
  onContextMenu: (e: React.MouseEvent) => void;
  closeMenu: () => void;
  contextMenuElement: ReactNode;
  isOpen: boolean;
}

export const useContextMenu = ({
  enabled = true,
  getIsEnabled,
  getMenu,
}: UseContextMenuOptions): UseContextMenuResult => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    window.addEventListener(CLOSE_CONTEXT_MENUS_EVENT, closeMenu);
    return () => {
      window.removeEventListener(CLOSE_CONTEXT_MENUS_EVENT, closeMenu);
    };
  }, [closeMenu]);

  const onContextMenu = useCallback(
    async (e: React.MouseEvent) => {
      if (!enabled || (getIsEnabled !== undefined && !getIsEnabled(e))) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      closeAllContextMenus();

      const menu = await getMenu({ closeMenu, event: e });

      if (!menu || menu.length === 0) {
        return;
      }

      setContextMenu({
        x: e.pageX,
        y: e.pageY,
        menu,
      });
    },
    [enabled, getIsEnabled, getMenu, closeMenu],
  );

  const contextMenuElement = useMemo(() => {
    if (!contextMenu) {
      return null;
    }

    return (
      <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeMenu}>
        {contextMenu.menu}
      </ContextMenu>
    );
  }, [contextMenu, closeMenu]);

  return {
    onContextMenu,
    closeMenu,
    contextMenuElement,
    isOpen: contextMenu !== null,
  };
};
