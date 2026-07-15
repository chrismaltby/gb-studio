import os from "os";
import Path from "path";
import { mkdtemp, remove, writeFile } from "fs-extra";
import {
  checksumFile,
  checksumMD5File,
  checksumString,
} from "lib/helpers/checksum";

describe("checksum helpers", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(Path.join(os.tmpdir(), "gbstudio-checksum-"));
  });

  afterEach(async () => {
    await remove(tmpDir);
  });

  test("checksumFile returns a SHA-1 file checksum", async () => {
    const filename = Path.join(tmpDir, "sha1.txt");
    await writeFile(filename, "test");

    await expect(checksumFile(filename)).resolves.toBe(
      "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    );
  });

  test("checksumMD5File returns an MD5 file checksum", async () => {
    const filename = Path.join(tmpDir, "md5.txt");
    await writeFile(filename, "test");

    await expect(checksumMD5File(filename)).resolves.toBe(
      "098f6bcd4621d373cade4e832627b4f6",
    );
  });

  test("checksumString returns a SHA-1 string checksum", () => {
    expect(checksumString("test")).toBe(
      "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    );
  });

  test("file checksums reject when the file cannot be read", async () => {
    const missingFile = Path.join(tmpDir, "missing.txt");

    await expect(checksumFile(missingFile)).rejects.toThrow();
    await expect(checksumMD5File(missingFile)).rejects.toThrow();
  });
});
