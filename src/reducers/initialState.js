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
  project: {
    settings: {
      showCollisions: true,
      showConnections: true,
      sidebarWidth: 300
    }
  },
  world: {},
  editor: {
    type: "world",
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
    sidebarWidth: 300
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
  }
};
