export default {
  tools: {
    selected: "select"
  },
  document: {
    path: "",
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
    map: "",
    index: 0
  },
  navigation: {
    section: "build",
    status: {}
  },
  console: {
    status: "running",
    output: [
      {
        type: "out",
        text: "Building xyz"
      },
      {
        type: "out",
        text: "..."
      },
      {
        type: "err",
        text: "Failed"
      }
    ]
  }
};
