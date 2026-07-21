import { useCallback } from "react";
import editorActions from "store/features/editor/editorActions";
import type { NavigatorSearchKey } from "store/features/editor/editorState";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const useNavigatorSearch = (key: NavigatorSearchKey) => {
  const dispatch = useAppDispatch();

  const storedSearchTerm = useAppSelector(
    (state) => state.editor.navigatorSearch[key],
  );

  const setSearchTerm = useCallback(
    (value: string) => {
      dispatch(
        editorActions.setNavigatorSearchTerm({ key, searchTerm: value }),
      );
    },
    [dispatch, key],
  );

  const toggleSearchEnabled = useCallback(() => {
    dispatch(editorActions.toggleNavigatorSearch(key));
  }, [dispatch, key]);

  return {
    searchEnabled: storedSearchTerm !== undefined,
    searchTerm: storedSearchTerm ?? "",
    setSearchTerm,
    toggleSearchEnabled,
  } as const;
};
