export const castEventToInt = (
  event: React.ChangeEvent<HTMLInputElement>,
  fallbackValue: number
): number => {
  const el = event && event.currentTarget;
  let value = parseInt(el.value, 10);
  if (!el.value || Number.isNaN(value)) {
    value = fallbackValue;
  }
  if (value !== undefined && el && el.type === "number") {
    if (value && (!el.step || el.step === "1")) {
      value = Math.round(value);
    }
    if (typeof el.min !== "undefined" && value < Number(el.min)) {
      const min = parseInt(el.min);
      if (!Number.isNaN(min)) {
        return min;
      }
    }
    if (typeof el.max !== "undefined" && value > Number(el.max)) {
      const max = parseInt(el.max);
      if (!Number.isNaN(max)) {
        return max;
      }
    }
  }
  return value;
};

export const castEventToFloat = (
  event: React.ChangeEvent<HTMLInputElement>,
  fallbackValue: number
): number => {
  const el = event && event.currentTarget;
  let value = parseFloat(el.value);
  if (!el.value || Number.isNaN(value)) {
    value = fallbackValue;
  }
  if (value !== undefined && el && el.type === "number") {
    if (value && (!el.step || el.step === "1")) {
      value = Math.round(value);
    }
    if (typeof el.min !== "undefined" && value < Number(el.min)) {
      const min = parseFloat(el.min);
      if (!Number.isNaN(min)) {
        return min;
      }
    }
    if (typeof el.max !== "undefined" && value > Number(el.max)) {
      const max = parseFloat(el.max);
      if (!Number.isNaN(max)) {
        return max;
      }
    }
  }
  return value;
};

export const castEventToBool = (
  event: React.ChangeEvent<HTMLInputElement>
): boolean => {
  const el = event && event.currentTarget;
  if (el && el.type === "checkbox") {
    return el.checked;
  }
  return false;
};
