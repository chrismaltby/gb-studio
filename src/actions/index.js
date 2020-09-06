export const pasteClipboardEntityInPlace = (clipboardData) => (dispatch, getState) => {
  const state = getState();
  const { scene: sceneId } = state.editor;
  if (clipboardData.__type === "scene") {
    const clipboardScene = clipboardData.scene;
    dispatch(pasteCustomEvents());
    dispatch(addScene(clipboardScene.x, clipboardScene.y, clipboardScene));
  } else if (sceneId && clipboardData.__type === "actor") {
    const clipboardActor = clipboardData.actor;
    dispatch(pasteCustomEvents());
    dispatch(
      addActor(sceneId, clipboardActor.x, clipboardActor.y, clipboardActor)
    );
  } else if (sceneId && clipboardData.__type === "trigger") {
    const clipboardTrigger = clipboardData.trigger;
    dispatch(pasteCustomEvents());
    dispatch(
      addTrigger(sceneId, clipboardTrigger.x, clipboardTrigger.y, clipboardTrigger.width, clipboardTrigger.height, clipboardTrigger)
    );
  }
};
