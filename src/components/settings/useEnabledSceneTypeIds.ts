import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

export const useEnabledSceneTypeIds = () => {
  const sceneTypes = useAppSelector((state) => state.engine.sceneTypes);
  const disabledSceneTypeIds = useAppSelector(
    (state) => state.project.present.settings.disabledSceneTypeIds,
  );
  const enabledSceneTypeIds = useMemo(() => {
    return sceneTypes
      .map((sceneType) => sceneType.key)
      .filter((key) => !disabledSceneTypeIds.includes(key));
  }, [disabledSceneTypeIds, sceneTypes]);
  return enabledSceneTypeIds;
};
