import memoize from "lodash/memoize";

const identity = <T>(t:T):T => t;

export const getCachedObject = memoize(identity, JSON.stringify);
