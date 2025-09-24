import {
  isString,
  isStringArray,
  isNumber,
  isBoolean,
  isUndefined,
  isMaybeString,
  isMaybeNumber,
  ensureType,
  ensureTypeGenerator,
  ensurePromisedTypeGenerator,
  ensureString,
  ensureStringArray,
  ensureNumber,
  ensureBoolean,
  ensurePromisedString,
  ensurePromisedNumber,
  ensureMaybeString,
  ensureMaybeNumber,
  omit,
} from "shared/types";

describe("isString", () => {
  test("should return true for string values", () => {
    expect(isString("hello")).toBe(true);
    expect(isString("")).toBe(true);
  });

  test("should return false for non-string values", () => {
    expect(isString(123)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
  });
});

describe("isStringArray", () => {
  test("should return true for arrays of strings", () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(["hello", "world"])).toBe(true);
    expect(isStringArray([""])).toBe(true);
  });

  test("should return false for non-arrays", () => {
    expect(isStringArray("hello")).toBe(false);
    expect(isStringArray(123)).toBe(false);
    expect(isStringArray(null)).toBe(false);
    expect(isStringArray(undefined)).toBe(false);
    expect(isStringArray({})).toBe(false);
  });

  test("should return false for arrays containing non-strings", () => {
    expect(isStringArray(["hello", 123])).toBe(false);
    expect(isStringArray([123, 456])).toBe(false);
    expect(isStringArray(["hello", null])).toBe(false);
    expect(isStringArray([true, false])).toBe(false);
  });
});

describe("isNumber", () => {
  test("should return true for valid numbers", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(123)).toBe(true);
    expect(isNumber(-456)).toBe(true);
    expect(isNumber(3.14)).toBe(true);
    expect(isNumber(Number.MAX_VALUE)).toBe(true);
    expect(isNumber(Number.MIN_VALUE)).toBe(true);
  });

  test("should return false for invalid numbers", () => {
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber(-Infinity)).toBe(false);
  });

  test("should return false for non-numbers", () => {
    expect(isNumber("123")).toBe(false);
    expect(isNumber(true)).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber({})).toBe(false);
    expect(isNumber([])).toBe(false);
  });
});

describe("isBoolean", () => {
  test("should return true for boolean values", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });

  test("should return false for non-boolean values", () => {
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean("true")).toBe(false);
    expect(isBoolean("false")).toBe(false);
    expect(isBoolean(null)).toBe(false);
    expect(isBoolean(undefined)).toBe(false);
    expect(isBoolean({})).toBe(false);
    expect(isBoolean([])).toBe(false);
  });
});

describe("isUndefined", () => {
  test("should return true for undefined", () => {
    expect(isUndefined(undefined)).toBe(true);
  });

  test("should return false for non-undefined values", () => {
    expect(isUndefined(null)).toBe(false);
    expect(isUndefined(0)).toBe(false);
    expect(isUndefined("")).toBe(false);
    expect(isUndefined(false)).toBe(false);
    expect(isUndefined({})).toBe(false);
    expect(isUndefined([])).toBe(false);
  });
});

describe("isMaybeString", () => {
  test("should return true for string values", () => {
    expect(isMaybeString("hello")).toBe(true);
    expect(isMaybeString("")).toBe(true);
  });

  test("should return true for undefined", () => {
    expect(isMaybeString(undefined)).toBe(true);
  });

  test("should return false for non-string, non-undefined values", () => {
    expect(isMaybeString(123)).toBe(false);
    expect(isMaybeString(true)).toBe(false);
    expect(isMaybeString(null)).toBe(false);
    expect(isMaybeString({})).toBe(false);
    expect(isMaybeString([])).toBe(false);
  });
});

describe("isMaybeNumber", () => {
  test("should return true for valid number values", () => {
    expect(isMaybeNumber(123)).toBe(true);
    expect(isMaybeNumber(0)).toBe(true);
    expect(isMaybeNumber(-456)).toBe(true);
    expect(isMaybeNumber(3.14)).toBe(true);
  });

  test("should return true for undefined", () => {
    expect(isMaybeNumber(undefined)).toBe(true);
  });

  test("should return false for invalid numbers", () => {
    expect(isMaybeNumber(NaN)).toBe(false);
    expect(isMaybeNumber(Infinity)).toBe(false);
    expect(isMaybeNumber(-Infinity)).toBe(false);
  });

  test("should return false for non-number, non-undefined values", () => {
    expect(isMaybeNumber("123")).toBe(false);
    expect(isMaybeNumber(true)).toBe(false);
    expect(isMaybeNumber(null)).toBe(false);
    expect(isMaybeNumber({})).toBe(false);
    expect(isMaybeNumber([])).toBe(false);
  });
});

describe("ensureType", () => {
  test("should return value if it matches type predicate", () => {
    expect(ensureType("hello", "fallback", isString)).toBe("hello");
    expect(ensureType(123, 0, isNumber)).toBe(123);
    expect(ensureType(true, false, isBoolean)).toBe(true);
  });

  test("should return fallback if value doesn't match type predicate", () => {
    expect(ensureType(123, "fallback", isString)).toBe("fallback");
    expect(ensureType("hello", 0, isNumber)).toBe(0);
    expect(ensureType("true", false, isBoolean)).toBe(false);
  });
});

describe("ensureTypeGenerator", () => {
  test("should create a function that ensures type with fallback", () => {
    const ensureStringValue = ensureTypeGenerator(isString);
    expect(ensureStringValue("hello", "fallback")).toBe("hello");
    expect(ensureStringValue(123, "fallback")).toBe("fallback");

    const ensureNumberValue = ensureTypeGenerator(isNumber);
    expect(ensureNumberValue(123, 0)).toBe(123);
    expect(ensureNumberValue("hello", 0)).toBe(0);
  });
});

describe("ensurePromisedTypeGenerator", () => {
  test("should create a function that ensures type from promises", async () => {
    const ensurePromisedStringValue = ensurePromisedTypeGenerator(isString);

    await expect(
      ensurePromisedStringValue(Promise.resolve("hello"), "fallback"),
    ).resolves.toBe("hello");
    await expect(
      ensurePromisedStringValue(Promise.resolve(123), "fallback"),
    ).resolves.toBe("fallback");
  });

  test("should return fallback on promise rejection", async () => {
    const ensurePromisedStringValue = ensurePromisedTypeGenerator(isString);

    await expect(
      ensurePromisedStringValue(Promise.reject(new Error("test")), "fallback"),
    ).resolves.toBe("fallback");
  });
});

describe("ensureString", () => {
  test("should return string value if input is string", () => {
    expect(ensureString("hello", "fallback")).toBe("hello");
    expect(ensureString("", "fallback")).toBe("");
  });

  test("should return fallback if input is not string", () => {
    expect(ensureString(123, "fallback")).toBe("fallback");
    expect(ensureString(null, "fallback")).toBe("fallback");
    expect(ensureString(undefined, "fallback")).toBe("fallback");
  });
});

describe("ensureStringArray", () => {
  test("should return string array if input is string array", () => {
    expect(ensureStringArray(["hello", "world"], ["fallback"])).toEqual([
      "hello",
      "world",
    ]);
    expect(ensureStringArray([], ["fallback"])).toEqual([]);
  });

  test("should return fallback if input is not string array", () => {
    expect(ensureStringArray(["hello", 123], ["fallback"])).toEqual([
      "fallback",
    ]);
    expect(ensureStringArray("hello", ["fallback"])).toEqual(["fallback"]);
    expect(ensureStringArray(null, ["fallback"])).toEqual(["fallback"]);
  });
});

describe("ensureNumber", () => {
  test("should return number value if input is valid number", () => {
    expect(ensureNumber(123, 0)).toBe(123);
    expect(ensureNumber(-456, 0)).toBe(-456);
    expect(ensureNumber(3.14, 0)).toBe(3.14);
  });

  test("should return fallback if input is not valid number", () => {
    expect(ensureNumber("123", 0)).toBe(0);
    expect(ensureNumber(NaN, 0)).toBe(0);
    expect(ensureNumber(Infinity, 0)).toBe(0);
    expect(ensureNumber(null, 0)).toBe(0);
  });
});

describe("ensureBoolean", () => {
  test("should return boolean value if input is boolean", () => {
    expect(ensureBoolean(true, false)).toBe(true);
    expect(ensureBoolean(false, true)).toBe(false);
  });

  test("should return fallback if input is not boolean", () => {
    expect(ensureBoolean(1, false)).toBe(false);
    expect(ensureBoolean("true", false)).toBe(false);
    expect(ensureBoolean(null, true)).toBe(true);
  });
});

describe("ensurePromisedString", () => {
  test("should return string from resolved promise", async () => {
    await expect(
      ensurePromisedString(Promise.resolve("hello"), "fallback"),
    ).resolves.toBe("hello");
  });

  test("should return fallback for non-string resolved value", async () => {
    await expect(
      ensurePromisedString(Promise.resolve(123), "fallback"),
    ).resolves.toBe("fallback");
  });

  test("should return fallback for rejected promise", async () => {
    await expect(
      ensurePromisedString(Promise.reject(new Error("test")), "fallback"),
    ).resolves.toBe("fallback");
  });
});

describe("ensurePromisedNumber", () => {
  test("should return number from resolved promise", async () => {
    await expect(ensurePromisedNumber(Promise.resolve(123), 0)).resolves.toBe(
      123,
    );
  });

  test("should return fallback for non-number resolved value", async () => {
    await expect(
      ensurePromisedNumber(Promise.resolve("hello"), 0),
    ).resolves.toBe(0);
  });

  test("should return fallback for rejected promise", async () => {
    await expect(
      ensurePromisedNumber(Promise.reject(new Error("test")), 0),
    ).resolves.toBe(0);
  });
});

describe("ensureMaybeString", () => {
  test("should return string value if input is string", () => {
    expect(ensureMaybeString("hello", undefined)).toBe("hello");
  });

  test("should return undefined if input is undefined", () => {
    expect(ensureMaybeString(undefined, "fallback")).toBe(undefined);
  });

  test("should return fallback if input is neither string nor undefined", () => {
    expect(ensureMaybeString(123, undefined)).toBe(undefined);
    expect(ensureMaybeString(null, "fallback")).toBe("fallback");
  });
});

describe("ensureMaybeNumber", () => {
  test("should return number value if input is valid number", () => {
    expect(ensureMaybeNumber(123, undefined)).toBe(123);
  });

  test("should return undefined if input is undefined", () => {
    expect(ensureMaybeNumber(undefined, 0)).toBe(undefined);
  });

  test("should return fallback if input is neither valid number nor undefined", () => {
    expect(ensureMaybeNumber("123", undefined)).toBe(undefined);
    expect(ensureMaybeNumber(null, 0)).toBe(0);
    expect(ensureMaybeNumber(NaN, 0)).toBe(0);
  });
});

describe("omit", () => {
  test("should remove specified keys from object", () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    expect(omit(obj, "b", "d")).toEqual({ a: 1, c: 3 });
  });

  test("should return new object without modifying original", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, "b");
    expect(result).toEqual({ a: 1, c: 3 });
    expect(obj).toEqual({ a: 1, b: 2, c: 3 });
  });

  test("should handle empty omit list", () => {
    const obj = { a: 1, b: 2 };
    expect(omit(obj)).toEqual({ a: 1, b: 2 });
  });

  test("should handle omitting non-existent keys", () => {
    const obj = { a: 1, b: 2 };
    expect(omit(obj, "c" as any)).toEqual({ a: 1, b: 2 });
  });

  test("should work with different value types", () => {
    const obj = {
      str: "hello",
      num: 123,
      bool: true,
      arr: [1, 2, 3],
      obj: { nested: true },
    };
    expect(omit(obj, "num", "bool")).toEqual({
      str: "hello",
      arr: [1, 2, 3],
      obj: { nested: true },
    });
  });
});
