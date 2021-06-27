import React, { MouseEventHandler } from "react";
import cx from "classnames";
import { useDispatch, useSelector } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { getCachedObject } from "lib/helpers/cache";
import { DMG_PALETTE, MIDDLE_MOUSE } from "../../consts";
import {
  actorSelectors,
  paletteSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { getSettings } from "store/features/settings/settingsState";
import { RootState } from "store/configureStore";
import { Tool } from "store/features/editor/editorState";
import { Palette } from "store/features/entities/entitiesTypes";

interface ActorProps {
  id: string;
  sceneId: string;
  palettes: Palette[];
  editable: boolean;
}

const Actor = (props: ActorProps) => {
  const dispatch = useDispatch();

  const dragActorStart = (payload: { actorId: string; sceneId: string }) =>
    dispatch(editorActions.dragActorStart(
      payload
    ));

  const dragActorStop = React.useCallback(() =>
    dispatch(editorActions.dragActorStop()),
  [dispatch]
  );

  const setTool = (payload: { tool: Tool }) =>
    dispatch(editorActions.setTool(payload));

  const { type: editorType, entityId, scene: sceneId } = useSelector((state: RootState) => state.editor);

  const actor = useSelector((state: RootState) => actorSelectors.selectById(state, props.id));

  const selected =
    editorType === "actor" &&
    sceneId === props.sceneId &&
    entityId === props.id;
  const showSprite = useSelector((state: RootState) => state.editor.zoom > 80);
  const settings = useSelector((state: RootState) => getSettings(state));
  const palettesLookup = useSelector((state: RootState) => paletteSelectors.selectEntities(state));

  const palette = React.useMemo(() => {
    if (!actor) return null;
    const gbcEnabled = settings.customColorsEnabled;

    return gbcEnabled
      ? getCachedObject(
        palettesLookup[actor.paletteId] ||
        palettesLookup[settings.defaultSpritePaletteId]
      )
      : DMG_PALETTE as Palette;
  }, [actor, palettesLookup, settings]);

  /**
   * This section of code is meant to setup `onMouseUp` and make sure that it
   * simultaneously handles if/when "dragActorStop" dep is updated, but also
   * to make sure that there are no memory leaks when that is done due to
   * removeEventListener not being passed the same reference of function
   *
   * I wish this code could be cleaner, but doing the 1:1 migration to TS/FC,
   * tis not
   */
  const isMouseListening = React.useRef(false);

  const onMouseUp = React.useRef(() => {})

  React.useEffect(() => {
    const oldFn = onMouseUp.current;
    onMouseUp.current = () => {
      dragActorStop();
      window.removeEventListener("mouseup", onMouseUp.current);
    };
    if (isMouseListening.current) {
      window.removeEventListener("mouseup", oldFn);
      window.addEventListener("mouseup", oldFn);
    }
  }, [dragActorStop])

  const onMouseDown: MouseEventHandler = (e) => {
    if (props.editable && e.nativeEvent.which !== MIDDLE_MOUSE && actor) {
      dragActorStart({ sceneId, actorId: actor.id });
      setTool({ tool: "select" });
      window.addEventListener("mouseup", onMouseUp.current);
    }
  };

  if (!actor || !palette) return;

  const { x, y, spriteSheetId, direction } = actor;
  return (
    <>
      {selected && actor.isPinned && <div className="Actor__ScreenPreview" />}
      <div
        className={cx("Actor", { "Actor--Selected": selected })}
        onMouseDown={onMouseDown}
        style={{
          top: y * 8,
          left: x * 8,
        }}
      >
        {showSprite && (
          <div style={{ pointerEvents: "none" }}>
            <SpriteSheetCanvas
              spriteSheetId={spriteSheetId}
              direction={direction}
              frame={0}
              palette={palette}
              palettes={props.palettes}
              offsetPosition
            />
          </div>
        )}
      </div>
    </>
  );
}

export default Actor;
