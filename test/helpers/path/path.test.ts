import PathMock from "path";
import { pathToPosix } from "shared/lib/helpers/path";

jest.mock("path");
const PathActual = jest.requireActual("path");

test("path should be posix", () => {
  expect(pathToPosix(PathActual.join("abc", "def"))).toEqual("abc/def");
});

it("path should be posix on Windows too", () => {
  (PathMock as { sep: string }).sep = PathActual.win32.sep;
  (PathMock as { posix: { sep: string } }).posix = PathActual.posix;

  const value = PathActual.win32.join("abc", "def");

  expect(value).toEqual("abc\\def");
  expect(pathToPosix(value)).toBe("abc/def");

  (PathMock as { sep: string }).sep = PathActual.sep;
  (PathMock as { posix: { sep: string } }).posix = PathActual.posix;
});
