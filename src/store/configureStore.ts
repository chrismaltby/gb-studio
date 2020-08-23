import { configureStore } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import rootReducer from "../reducers/rootReducer";
import electronMiddleware from "../middleware/electron";
import buildGameMiddleware from "../middleware/buildGame";
import musicMiddleware from "../middleware/music";
import soundFxMiddleware from "../middleware/soundfx";
import warningsMiddleware from "../middleware/warnings";
import loggerMiddleware from "../middleware/logger";

const DEBUG = false;

let middleware = [
  thunk,
  electronMiddleware,
  buildGameMiddleware,
  musicMiddleware,
  soundFxMiddleware,
  warningsMiddleware
];

if (process.env.NODE_ENV !== "production" && DEBUG) {
  middleware = [...middleware, loggerMiddleware];
}

export type RootState = ReturnType<typeof rootReducer>

const store = configureStore({
  reducer: rootReducer,
  middleware
})

export type AppDispatch = typeof store.dispatch
export default store;
