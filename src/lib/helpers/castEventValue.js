export default event => {
  const el = event.currentTarget;
  let value = el ? el.value : event;
  if (value && el && el.type === "number") {
    value = parseFloat(value);
    if (value && (!el.step || el.step === 1)) {
      value = Math.round(value);
    }
    if (value && typeof el.min.length > 0 && value < el.min) {
      value = el.min;
    }
    if (value && typeof el.max.length > 0 && value > el.max) {
      value = el.max;
    }
  }
  if (el && el.type === "checkbox") {
    value = el.checked;
  }
  return value;
};
