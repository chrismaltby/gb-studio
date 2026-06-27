import { useCallback } from "react";
import { useAppDispatch, useAppStore } from "store/hooks";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { useContextMenu } from "ui/hooks/use-context-menu";
import renderSceneContextMenu from "components/world/contextMenus/renderSceneContextMenu";

export const useSceneContextMenu = (sceneId: string, isEnabled: boolean) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const getContextMenu = useCallback(
    ({ closeMenu: onClose }: { closeMenu: () => void }) => {
      const state = store.getState();
      const scene = sceneSelectors.selectById(state, sceneId);

      if (!scene) {
        return undefined;
      }

      const { x: hoverX, y: hoverY } = state.editor.hover;

      return renderSceneContextMenu({
        dispatch,
        sceneId,
        additionalSceneIds: state.editor.sceneSelectionIds,
        startSceneId: state.project.present.settings.startSceneId,
        startDirection: state.project.present.settings.startDirection,
        hoverX,
        hoverY,
        colorsEnabled: state.project.present.settings.colorMode !== "mono",
        colorModeOverride: scene.colorModeOverride,
        runSceneSelectionOnly:
          state.project.present.settings.runSceneSelectionOnly,
        onClose,
      });
    },
    [dispatch, sceneId, store],
  );

  const getContextMenuEnabled = useCallback(() => {
    return isEnabled;
  }, [isEnabled]);

  return useContextMenu({
    getMenu: getContextMenu,
    getIsEnabled: getContextMenuEnabled,
  });
};
