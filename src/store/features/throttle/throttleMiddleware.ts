import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import throttle from "lodash/throttle";
import { DebouncedFunc } from "lodash";

type ThrottleableAction = {
  type: string;
  meta: {
    throttle: number;
    key: string;
  };
};

const isThrottleableAction = (
  action: unknown,
): action is ThrottleableAction => {
  if (typeof action !== "object" || action === null) return false;
  const actionWithMeta = action as { meta?: unknown };
  if (typeof actionWithMeta.meta !== "object" || actionWithMeta.meta === null) {
    return false;
  }
  const metaWithThrottle = actionWithMeta.meta as {
    throttle?: unknown;
    key?: unknown;
  };
  return (
    typeof metaWithThrottle.throttle === "number" &&
    typeof metaWithThrottle.key === "string"
  );
};

const throttled: Record<
  string,
  DebouncedFunc<Dispatch<ThrottleableAction>>
> = {};

const throttleMiddleware: Middleware<Dispatch, RootState> =
  (_store) => (next) => async (action) => {
    if (!isThrottleableAction(action)) {
      return next(action);
    }
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
    }) as DebouncedFunc<Dispatch<ThrottleableAction>>;

    throttled[key] = newCall;

    return newCall(action);
  };

export default throttleMiddleware;
