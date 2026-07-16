import EventEmitter from "events";

const watch = jest.fn().mockImplementation(() => {
  const watcher = new EventEmitter();
  watcher.close = jest.fn();
  return watcher;
});

const chokidar = {
  watch,
};

export default chokidar;
export { watch };
