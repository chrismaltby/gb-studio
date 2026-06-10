import { useEffect } from "react";
import API from "renderer/lib/api";
import { canPerformSelectAll } from "renderer/lib/helpers/dom";

interface UseSelectAllShortcutOptions {
  onSelectAll: () => void;
  enabled?: boolean;
}

export const useSelectAllShortcut = ({
  onSelectAll,
  enabled = true,
}: UseSelectAllShortcutOptions): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.code === "KeyA") {
        if (e.target instanceof Element && canPerformSelectAll(e.target)) {
          return;
        }

        e.preventDefault();
        onSelectAll();
      }
    };

    if (API.env === "web") {
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
      };
    } else {
      return API.events.menu.selectAll.subscribe(onSelectAll);
    }
  }, [enabled, onSelectAll]);
};
