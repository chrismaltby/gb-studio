export default {
  tools: {
    selected: "select"
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
      showConnections: true
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
    sceneDragging: false,
    sceneDragX: 0,
    sceneDragY: 0,
    uiVersion: 0
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
    output: []
  },
  clipboard: {
    event: null
  }
};
