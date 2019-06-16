/* eslint-disable no-console */
export default store => next => action => {
  console.group(action.type);
  console.info("dispatching", action);
  console.log("prev state", store.getState());
  const result = next(action);
  console.log("next state", store.getState());
  console.groupEnd();
  return result;
};
