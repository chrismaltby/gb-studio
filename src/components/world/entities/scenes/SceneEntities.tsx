import React, { memo, useCallback, useMemo } from "react";
import WorldActor from "./actors/ActorView";
import TriggerView from "./triggers/TriggerView";
import { SceneContext } from "components/script/context/SceneContext";
import { useAppSelector, useAppSelectorPick } from "store/hooks";
import {
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import { DMG_PALETTE } from "consts";
import { MonoOBJPalette } from "shared/lib/resources/types";

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

    const getSpritePalette = useCallback(
      (paletteIndex: number) => {
        const sceneSpritePaletteIds = scene?.spritePaletteIds ?? [];
        if (sceneSpritePaletteIds[paletteIndex] === "dmg") {
          return DMG_PALETTE;
        }
        return (
          palettesLookup[sceneSpritePaletteIds[paletteIndex]] ||
          palettesLookup[defaultSpritePaletteIds[paletteIndex]] ||
          DMG_PALETTE
        );
      },
      [defaultSpritePaletteIds, palettesLookup, scene?.spritePaletteIds],
    );

    const spritePalettes = useMemo(
      () =>
        gbcEnabled
          ? [
              getSpritePalette(0),
              getSpritePalette(1),
              getSpritePalette(2),
              getSpritePalette(3),
              getSpritePalette(4),
              getSpritePalette(5),
              getSpritePalette(6),
              getSpritePalette(7),
            ]
          : undefined,
      [gbcEnabled, getSpritePalette],
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
