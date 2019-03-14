import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import rootReducer from "../reducers/rootReducer";
import electronMiddleware from "../middleware/electron";
import buildGameMiddleware from "../middleware/buildGame";
import musicMiddleware from "../middleware/music";

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore() {
  return createStore(
    rootReducer,
    composeEnhancers(
      applyMiddleware(
        thunk,
        electronMiddleware,
        buildGameMiddleware,
        musicMiddleware
      )
    )
  );
}
