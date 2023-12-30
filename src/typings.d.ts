import configureStore from "store/configureStore";

declare global {
  interface Window {
    store: typeof configureStore;
    undo: () => void;
    ActionCreators: any
  }
}
