import React, { memo, useMemo } from "react";
import WorldActor from "./actors/ActorView";
import TriggerView from "./triggers/TriggerView";
import { SceneContext } from "components/script/context/SceneContext";
import { useAppSelector, useAppSelectorPick } from "store/hooks";
import {
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import { MonoOBJPalette } from "shared/lib/resources/types";
import { resolveScenePalettes } from "components/world/entities/scenes/helpers/scenePalettes";

interface SceneEntitiesProps {
  sceneId: string;
  editable?: boolean;
}

export const SceneEntities = memo(
  ({ sceneId, editable }: SceneEntitiesProps) => {
    const scene = useAppSelectorPick(
      (state) => sceneSelectors.selectById(state, sceneId),
      [
        "actors",
        "triggers",
        "spriteMode",
        "spritePaletteIds",
        "monoOBP0",
        "monoOBP1",
      ],
    );

    const defaultSpriteMode = useAppSelector(
      (state) => state.project.present.settings.spriteMode,
    );

    const spriteMode = scene?.spriteMode ?? defaultSpriteMode;

    const palettesLookup = useAppSelector((state) =>
      paletteSelectors.selectEntities(state),
    );

    const defaultSpritePaletteIds = useAppSelector(
      (state) => state.project.present.settings.defaultSpritePaletteIds ?? [],
    );

    const gbcEnabled = useAppSelector(
      (state) => state.project.present.settings.colorMode !== "mono",
    );

    const defaultMonoOBP0 = useAppSelector(
      (state) => state.project.present.settings.defaultMonoOBP0,
    );
    const defaultMonoOBP1 = useAppSelector(
      (state) => state.project.present.settings.defaultMonoOBP1,
    );

    const monoOBJPalettes = useMemo(() => {
      return [
        scene?.monoOBP0 || defaultMonoOBP0,
        scene?.monoOBP1 || defaultMonoOBP1,
      ] as [MonoOBJPalette, MonoOBJPalette];
    }, [scene?.monoOBP0, defaultMonoOBP0, scene?.monoOBP1, defaultMonoOBP1]);

    const spritePalettes = useMemo(
      () =>
        resolveScenePalettes(
          scene?.spritePaletteIds,
          defaultSpritePaletteIds,
          palettesLookup,
          gbcEnabled,
        ),
      [
        gbcEnabled,
        scene?.spritePaletteIds,
        defaultSpritePaletteIds,
        palettesLookup,
      ],
    );

    if (!scene) {
      return null;
    }

    return (
      <>
        {scene.triggers.map((triggerId) => (
          <TriggerView
            key={triggerId}
            id={triggerId}
            sceneId={sceneId}
            editable={editable}
          />
        ))}
        <SceneContext.Provider value={{ spriteMode }}>
          {scene.actors.map((actorId) => (
            <WorldActor
              key={actorId}
              id={actorId}
              sceneId={sceneId}
              palettes={spritePalettes}
              monoPalettes={monoOBJPalettes}
              editable={editable}
            />
          ))}
        </SceneContext.Provider>
      </>
    );
  },
);
