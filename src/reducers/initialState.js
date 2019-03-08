export default {
  tools: {
    selected: "select"
  },
  document: {
    path: "",
    root: "",
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
    sceneDragging: false,
    sceneDragX: 0,
    sceneDragY: 0
  },
  navigation: {
    section: "build",
    status: {}
  },
  console: {
    status: "idle",
    output: []
  }
};
