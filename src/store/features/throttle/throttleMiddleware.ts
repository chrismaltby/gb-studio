import { AnyAction, Dictionary, Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import throttle from "lodash/throttle";
import { Cancelable } from "lodash";

const throttled: Dictionary<Dispatch<AnyAction> & Cancelable> = {};

const throttleMiddleware: Middleware<Dispatch, RootState> =
  (_store) => (next) => async (action) => {
    const time = (action.meta && action.meta.throttle) as number | undefined;
    if (!time) return next(action);
    const key = `${action.type}_${action.meta.key}`;
    const previousCall = throttled[key];
    if (previousCall) {
      return previousCall(action);
    }

    const newCall = throttle(next, time, {
      leading: true,
      trailing: true,
    });

    throttled[key] = newCall;

    return newCall(action);
  };

export default throttleMiddleware;
