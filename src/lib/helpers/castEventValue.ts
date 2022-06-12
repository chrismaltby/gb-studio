type ChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.ChangeEvent<HTMLTextAreaElement>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (event: any): any => {
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

export const castAsBool = (event: ChangeEvent): boolean => {
  const el = event.currentTarget;
  if (el && el.type === "checkbox" && "checked" in el) {
    return el.checked;
  }
  return false;
};

export const castAsInt = (event: ChangeEvent): number => {
  const el = event.currentTarget;
  const val = parseInt(el.value);
  return val;
};

export const castWithMiddleware =
  <T extends unknown>(
    castFn: (event: ChangeEvent) => T,
    ...middleware: ((input: T) => T)[]
  ) =>
  (event: ChangeEvent): T => {
    let initialValue = castFn(event);

    if (middleware) {
      middleware.forEach((fn) => {
        initialValue = fn(initialValue);
      });
    }

    return initialValue;
  };

export const withDefaultNumber = (defaultValue: number) => (value: number) => {
  if (isNaN(value)) {
    return defaultValue;
  }
  return value;
};

export const withinRange = (min: number, max: number) => (value: number) => {
  return Math.min(max, Math.max(min, value));
};
