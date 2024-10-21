import EventEmitter from "events";

const mockWatcher = new EventEmitter();

const chokidar = {
  watch: jest.fn().mockImplementation(() => mockWatcher),
};

export default chokidar;
