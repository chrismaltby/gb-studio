export default {
  tools: {
    selected: "select",
    prefab: null
  },
  document: {
    path: "",
    root: "",
    loaded: false,
    saving: false,
    modified: false
  },
  world: {},
  editor: {
    type: "world",
    worldFocus: false,
    scene: "",
    index: 0,
    zoom: 100,
    zoomSprite: 400,
    zoomImage: 200,
    zoomUI: 200,
    dragging: "",
    sceneDragging: false,
    sceneDragX: 0,
    sceneDragY: 0,
    uiVersion: 0,
    hover: {
      sceneId: "",
      actorId: "",
      x: 0,
      y: 0
    }
  },
  navigation: {
    section: "world",
    status: {}
  },
  music: {
    playing: false
  },
  console: {
    status: "idle",
    output: [],
    warnings: []
  },
  clipboard: {
    event: null,
    actor: null,
    trigger: null,
    scene: null,
    last: null
  },
  entities: {
    entities: {
      actors: {},
      backgrounds: {},
      music: {},
      scenes: {},
      spriteSheets: {},
      triggers: {},
      variables: {}
    },
    result: {
      settings: {
        showCollisions: true,
        showConnections: true,
        worldScrollX: 0,
        worldScrollY: 0,
        zoom: 100,
        customColorsWhite: "E0F8D0",
        customColorsLight: "88C070",
        customColorsDark: "306850",
        customColorsBlack: "081820"          
      },
      scenes: []
    }
  },
  settings: {
    worldSidebarWidth: 300,
    filesSidebarWidth: 300
  }
};
