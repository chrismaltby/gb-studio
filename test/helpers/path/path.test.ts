import PathMock from "path";
import { ensureNonEmptyBasename, pathToPosix } from "shared/lib/helpers/path";

jest.mock("path");
const PathActual = jest.requireActual("path");

const setupDefaultPathMock = () => {
  Object.assign(PathMock, PathActual);
};

const setupWindowsPathMock = () => {
  Object.assign(PathMock, PathActual.win32);
};

describe("pathToPosix", () => {
  beforeEach(() => {
    setupDefaultPathMock();
  });

  test("path should be posix", () => {
    expect(pathToPosix(PathActual.join("abc", "def"))).toEqual("abc/def");
  });

  it("path should be posix on Windows too", () => {
    setupWindowsPathMock();
    const value = PathActual.win32.join("abc", "def");
    expect(value).toEqual("abc\\def");
    expect(pathToPosix(value)).toBe("abc/def");
  });
});

describe("ensureNonEmptyBasename", () => {
  beforeEach(() => {
    setupDefaultPathMock();
  });

  it("should return the same filename if the basename is not empty", () => {
    expect(ensureNonEmptyBasename("assets/sounds/effect.wav")).toBe(
      "assets/sounds/effect.wav",
    );
  });

  it("should prefix the basename with an underscore if it starts with a dot", () => {
    expect(ensureNonEmptyBasename("assets/sounds/.wav")).toBe(
      "assets/sounds/_.wav",
    );
  });

  it("should key all extension parts if the basename contains multiple dots", () => {
    expect(ensureNonEmptyBasename("assets/sounds/.hidden.wav")).toBe(
      "assets/sounds/_.hidden.wav",
    );
  });

  it("should use an underscore as basename if the basename is empty", () => {
    expect(ensureNonEmptyBasename("assets/sounds/")).toBe("assets/sounds/_");
  });

  it("should use an underscore as basename if the basename is empty using Windows paths", () => {
    setupWindowsPathMock();
    expect(ensureNonEmptyBasename("assets\\sounds\\")).toBe("assets/sounds/_");
  });

  it("should handle filenames that are just a dot", () => {
    expect(ensureNonEmptyBasename(".")).toBe("_.");
  });

  it("should handle filenames that are just a dot and extension", () => {
    expect(ensureNonEmptyBasename(".wav")).toBe("_.wav");
  });
});
