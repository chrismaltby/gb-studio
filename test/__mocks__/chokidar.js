import EventEmitter from "events";

const chokidar = {
  watch: jest.fn().mockImplementation(() => {
    const watcher = new EventEmitter();
    watcher.close = jest.fn();
    return watcher;
  }),
};

export default chokidar;
