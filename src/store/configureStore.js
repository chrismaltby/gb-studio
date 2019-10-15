import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import rootReducer from "../reducers/rootReducer";
import electronMiddleware from "../middleware/electron";
import buildGameMiddleware from "../middleware/buildGame";
import musicMiddleware from "../middleware/music";
import soundFxMiddleware from "../middleware/soundfx";
import loggerMiddleware from "../middleware/logger";

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const DEBUG = false;

let middleware = [
  thunk,
  electronMiddleware,
  buildGameMiddleware,
  musicMiddleware,
  soundFxMiddleware
];

if (process.env.NODE_ENV !== "production" && DEBUG) {
  middleware = [...middleware, loggerMiddleware];
}

export default function configureStore() {
  return createStore(
    rootReducer,
    composeEnhancers(applyMiddleware(...middleware))
  );
}
