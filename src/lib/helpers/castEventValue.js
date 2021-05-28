export default (event) => {
  const el = event && event.currentTarget;
  let value = el ? el.value : event;
  if (value !== undefined && el && el.type === "number") {
    value = parseFloat(value);
    if (value && (!el.step || el.step === 1)) {
      value = Math.round(value);
    }
    if (value && typeof el.min !== "undefined" && value < el.min) {
      const min = parseFloat(el.min);
      if (!Number.isNaN(min)) {
        value = min;
      }
    }

    if (value && typeof el.max !== "undefined" && value > el.max) {
      // console.log(el.max, typeof el.max);
      const max = parseFloat(el.max);
      if (!Number.isNaN(max)) {
        value = max;
      }
    }

    if (Number.isNaN(value)) {
      value = null;
    }
  }
  if (el && el.type === "checkbox") {
    value = el.checked;
  }
  return value;
};
