import { bytesToHumanReadable } from "shared/lib/helpers/formatBytes";

const KB = 1024;
const MB = 1024 * 1024;

describe("bytesToHumanReadable", () => {
  it("renders values below 1 KiB as bytes", () => {
    expect(bytesToHumanReadable(512)).toBe("512 bytes");
  });

  it("renders KiB values", () => {
    expect(bytesToHumanReadable(128 * KB)).toBe("128 KiB");
    expect(bytesToHumanReadable(1536)).toBe("1.5 KiB");
  });

  it("renders MiB values", () => {
    expect(bytesToHumanReadable(4 * MB)).toBe("4 MiB");
    expect(bytesToHumanReadable(1.5 * MB)).toBe("1.5 MiB");
  });
});
