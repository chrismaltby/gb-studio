/* eslint-disable no-console */
const shallowCheck = (old, next) =>
  Object.keys(old).filter((key) => old[key] !== next[key]);

const rerenderCheck = (label, oldProps, oldState, nextProps, nextState) => {
  const propChanges = shallowCheck(oldProps, nextProps);
  const stateChanges = shallowCheck(oldState, nextState);

  if (propChanges.length > 0) {
    console.warn(label, "Props changed", propChanges);
  }
  if (stateChanges.length > 0) {
    console.warn(label, "State changed", stateChanges);
  }

  if (propChanges.length === 0 && stateChanges.length === 0) {
    console.warn(label, "No data changed but still rerendered");
  }
};

export default rerenderCheck;
