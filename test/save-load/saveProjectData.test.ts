// saveProjectData.test.ts
import { ensureDir, remove } from "fs-extra";
import glob from "glob";
import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";
import Path from "path";
import { WriteResourcesPatch } from "shared/lib/resources/types";
import saveProjectData from "lib/project/saveProjectData";

jest.mock("fs-extra");
jest.mock("glob");
jest.mock("lib/helpers/fs/writeFileWithBackup");

describe("saveProjectData", () => {
  const mockProjectPath = "/path/to/project.gbsproj";
  const mockProjectFolder = "/path/to";

  const mockPatch: WriteResourcesPatch = {
    data: [
      {
        path: "project/scene1__0/scene.gbsres",
        checksum: "checksum1",
        data: "{}",
      },
      {
        path: "project/actor1__0.gbsres",
        checksum: "checksum2",
        data: "{}",
      },
    ],
    paths: [
      "project/scene1__0/scene.gbsres",
      "project/actor1__0.gbsres",
      "project/trigger1__0.gbsres",
    ],
    metadata: {
      _resourceType: "project",
      name: "Test Project",
      author: "Author",
      notes: "",
      _version: "1.0.0",
      _release: "1.0.0",
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should save project data correctly", async () => {
    const mockExistingPaths = [
      "project/scene1__0/scene.gbsres",
      "project/actor1__0.gbsres",
      "project/oldfile.gbsres",
    ].map((path) => Path.join(mockProjectFolder, path));

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, mockExistingPaths);
    });

    await saveProjectData(mockProjectPath, mockPatch);

    // expect(glob).toHaveBeenCalledWith(
    //   Path.join(mockProjectPartsFolder, "**/*.gbsres"),
    //   expect.any(Function)
    // );

    expect(ensureDir).toHaveBeenCalledWith(
      Path.join(mockProjectFolder, "project/scene1__0"),
    );
    // expect(ensureDir).toHaveBeenCalledWith(
    //   Path.join(mockProjectFolder, "project")
    // );

    expect(writeFileWithBackupAsync).toHaveBeenCalledWith(
      Path.join(mockProjectFolder, "project/scene1__0/scene.gbsres"),
      "{}",
    );
    expect(writeFileWithBackupAsync).toHaveBeenCalledWith(
      Path.join(mockProjectFolder, "project/actor1__0.gbsres"),
      "{}",
    );
    expect(writeFileWithBackupAsync).toHaveBeenCalledWith(
      mockProjectPath,
      expect.any(String),
    );

    expect(remove).toHaveBeenCalledWith(
      Path.join(mockProjectFolder, "project/oldfile.gbsres"),
    );
  });

  it("should handle no resources to update", async () => {
    const mockPatchWithNoUpdates: WriteResourcesPatch = {
      data: [],
      paths: mockPatch.paths,
      metadata: mockPatch.metadata,
    };

    const mockExistingPaths = [
      "project/scene1__0/scene.gbsres",
      "project/actor1__0.gbsres",
    ].map((path) => Path.join(mockProjectFolder, path));

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, mockExistingPaths);
    });

    await saveProjectData(mockProjectPath, mockPatchWithNoUpdates);

    expect(ensureDir).not.toHaveBeenCalled();
    expect(writeFileWithBackupAsync).toHaveBeenCalledWith(
      mockProjectPath,
      expect.any(String),
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("should handle errors during directory creation", async () => {
    const mockError = new Error("Failed to create directory");
    (ensureDir as jest.Mock).mockRejectedValueOnce(mockError);
    (ensureDir as jest.Mock).mockReturnValue(Promise.resolve());

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, []);
    });

    await expect(saveProjectData(mockProjectPath, mockPatch)).rejects.toThrow(
      "Failed to create directory",
    );

    expect(ensureDir).toHaveBeenCalled();
  });

  it("should handle errors during file writing", async () => {
    const mockError = new Error("Failed to write file");
    (writeFileWithBackupAsync as jest.Mock).mockRejectedValueOnce(mockError);
    (writeFileWithBackupAsync as jest.Mock).mockReturnValue(Promise.resolve());

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, []);
    });

    await expect(saveProjectData(mockProjectPath, mockPatch)).rejects.toThrow(
      "Failed to write file",
    );

    expect(writeFileWithBackupAsync).toHaveBeenCalled();
  });

  it("should handle errors during file removal", async () => {
    const mockError = new Error("Failed to remove file");
    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(
        null,
        [
          "project/scene1__0/scene.gbsres",
          "project/actor1__0.gbsres",
          "project/oldfile.gbsres",
        ].map((path) => Path.join(mockProjectFolder, path)),
      );
    });
    (remove as jest.Mock).mockRejectedValueOnce(mockError);

    await expect(saveProjectData(mockProjectPath, mockPatch)).rejects.toThrow(
      "Failed to remove file",
    );

    expect(remove).toHaveBeenCalled();
  });

  it("should not remove files if there are no extra files", async () => {
    const mockExistingPaths = [
      "project/scene1__0/scene.gbsres",
      "project/actor1__0.gbsres",
    ].map((path) => Path.join(mockProjectFolder, path));

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, mockExistingPaths);
    });

    await saveProjectData(mockProjectPath, mockPatch);

    expect(remove).not.toHaveBeenCalled();
  });

  it("should handle empty patch", async () => {
    const emptyPatch: WriteResourcesPatch = {
      data: [],
      paths: [],
      metadata: mockPatch.metadata,
    };

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, []);
    });

    await saveProjectData(mockProjectPath, emptyPatch);

    expect(ensureDir).not.toHaveBeenCalled();
    expect(writeFileWithBackupAsync).toHaveBeenCalledWith(
      mockProjectPath,
      expect.any(String),
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("should not delete Japanese scene files when dakuten differs only by normalization", async () => {
    /**
     * "だくてんのあるシーン"
     *
     * NFC form:
     *   だ (single codepoint)
     *
     * NFD form:
     *   た + ゙ (combining dakuten)
     */
    const nfcName = "project/だくてんのあるシーン__0.gbsres";
    const nfdName = "project/だくてんのあるシーン__0.gbsres";

    expect(nfcName).not.toBe(nfdName);

    const mockExistingPaths = [nfdName].map((path) =>
      Path.join(mockProjectFolder, path),
    );

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, mockExistingPaths);
    });

    const unicodePatch: WriteResourcesPatch = {
      data: [
        {
          path: nfcName,
          checksum: "checksum",
          data: "{}",
        },
      ],
      paths: [nfcName],
      metadata: mockPatch.metadata,
    };

    await saveProjectData(mockProjectPath, unicodePatch);

    expect(remove).not.toHaveBeenCalled();
  });

  it("should not delete resources when unicode differs only by normalization (NFD vs NFC)", async () => {
    /**
     * "é" represented two ways:
     * NFC  -> "Café"
     * NFD  -> "Cafe\u0301"
     */
    const nfcName = "project/Café__0.gbsres";
    const nfdName = "project/Cafe\u0301__0.gbsres";

    const mockExistingPaths = [nfdName].map((path) =>
      Path.join(mockProjectFolder, path),
    );

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, mockExistingPaths);
    });

    const unicodePatch: WriteResourcesPatch = {
      data: [
        {
          path: nfcName,
          checksum: "checksum",
          data: "{}",
        },
      ],
      paths: [nfcName],
      metadata: mockPatch.metadata,
    };

    await saveProjectData(mockProjectPath, unicodePatch);

    expect(remove).not.toHaveBeenCalled();
  });

  it("should normalize resource paths before writing files", async () => {
    const nfdName = "project/Cafe\u0301__0.gbsres";
    const nfcName = "project/Café__0.gbsres";

    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, []);
    });

    const unicodePatch: WriteResourcesPatch = {
      data: [
        {
          path: nfdName,
          checksum: "checksum",
          data: "{}",
        },
      ],
      paths: [nfdName],
      metadata: mockPatch.metadata,
    };

    await saveProjectData(mockProjectPath, unicodePatch);

    expect(writeFileWithBackupAsync).toHaveBeenCalledWith(
      Path.join(mockProjectFolder, nfcName),
      "{}",
    );
  });

  it("should throw if a patch contains absolute resource paths", async () => {
    (glob as unknown as jest.Mock).mockImplementation((pattern, callback) => {
      callback(null, []);
    });

    const badPatch: WriteResourcesPatch = {
      data: [],
      paths: ["/absolute/path.gbsres"],
      metadata: mockPatch.metadata,
    };

    await expect(saveProjectData(mockProjectPath, badPatch)).rejects.toThrow(
      "normalizeResourcePath must only be used with project-relative paths",
    );
  });
});
