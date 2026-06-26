import React from "react";
import { useAppSelector, useAppSelectorPick } from "store/hooks";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";

interface SceneParallaxOverlayProps {
  sceneId: string;
}

export const SceneParallaxOverlay = ({
  sceneId,
}: SceneParallaxOverlayProps) => {
  const scene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, sceneId),
    ["parallax", "height"],
  );

  const parallaxHoverLayer = useAppSelector(
    (state) => state.editor.parallaxHoverLayer,
  );

  if (!scene || !scene.parallax || parallaxHoverLayer === undefined) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      {scene.parallax.map(
        (layer, layerIndex, layers) =>
          layerIndex !== layers.length - 1 && (
            <div
              key={layerIndex}
              style={{
                background:
                  parallaxHoverLayer === layerIndex
                    ? `rgba(0,255,255,0.7)`
                    : `rgba(0,255,255,0.2)`,
                height: (layer.height || 1) * 8,
                borderBottom: "2px solid rgb(0,200,200)",
                boxSizing: "border-box",
              }}
            />
          ),
      )}
      <div
        style={{
          background:
            parallaxHoverLayer === scene.parallax.length - 1
              ? `rgba(0,255,255,0.7)`
              : `rgba(0,255,255,0.2)`,
          height:
            8 *
            (scene.height -
              scene.parallax.reduce(
                (memo, layer, layerIndex, layers) =>
                  memo + layerIndex < layers.length - 1 ? layer.height || 1 : 0,
                0,
              )),
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};
