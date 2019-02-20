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
      zoom: 100,
      showCollisions: true,
      showConnections: true
    }
  },
  world: {},
  editor: {
    type: "world",
    scene: "",
    index: 0,
    sceneDragging: false,
    sceneDragX: 0,
    sceneDragY: 0
  },
  navigation: {
    section: "world",
    status: {}
  },
  console: {
    status: "idle",
    output: []
  }
};
