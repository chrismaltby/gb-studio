import { mkdtemp, outputFile, remove, symlink } from "fs-extra";
import os from "os";
import Path from "path";
import {
  collectTempPreviewFiles,
  TempMdClient,
  TempPreviewRecord,
} from "lib/tempPreview/tempMdClient";

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: jest.fn().mockReturnValue(null) },
  json: jest.fn().mockResolvedValue(body),
});

describe("TempMdClient", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(Path.join(os.tmpdir(), "gbstudio-preview-"));
    await outputFile(Path.join(directory, "index.html"), "<h1>Game</h1>");
    await outputFile(Path.join(directory, "js", "app.js"), "play();");
  });

  afterEach(async () => {
    await remove(directory);
  });

  test("publishes a validated web build and returns its update capability", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        response({
          sessionId: "session-1",
          tempId: "preview-1",
          uploadToken: "upload-secret",
          uploads: [
            {
              path: "index.html",
              url: "https://api.temp.md/publish-sessions/session-1/files/1",
              status: "expected",
            },
            {
              path: "js/app.js",
              url: "https://api.temp.md/publish-sessions/session-1/files/2",
              status: "expected",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(
        response({
          tempId: "preview-1",
          canonicalUrl: "https://preview-1.temp.md",
          updateToken: "update-secret",
          expiresAt: "2026-09-01T00:00:00.000Z",
        }),
      );

    const record = await new TempMdClient({
      fetch: fetchMock as never,
    }).publish(directory, "My Game");

    expect(record).toMatchObject({
      tempId: "preview-1",
      canonicalUrl: "https://preview-1.temp.md/",
      updateToken: "update-secret",
    });
    const sessionRequest = fetchMock.mock.calls[0];
    expect(sessionRequest[0]).toBe("https://api.temp.md/publish-sessions");
    const manifest = JSON.parse(sessionRequest[1].body as string);
    expect(manifest.files).toEqual([
      expect.objectContaining({
        path: "index.html",
        size: 13,
        contentType: "text/html",
        hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      expect.objectContaining({
        path: "js/app.js",
        contentType: "text/javascript",
      }),
    ]);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer upload-secret",
    );
  });

  test("updates the same preview and retains its existing capability", async () => {
    const current: TempPreviewRecord = {
      tempId: "preview-1",
      canonicalUrl: "https://preview-1.temp.md/",
      updateToken: "update-secret",
      expiresAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-08-25T00:00:00.000Z",
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        response({
          sessionId: "session-2",
          tempId: "preview-1",
          uploadToken: "upload-secret",
          uploads: [],
        }),
      )
      .mockResolvedValueOnce(
        response({
          tempId: "preview-1",
          canonicalUrl: "https://preview-1.temp.md/",
          expiresAt: "2026-09-02T00:00:00.000Z",
        }),
      );

    const record = await new TempMdClient({
      fetch: fetchMock as never,
    }).publish(directory, "My Game", current);

    expect(record.updateToken).toBe("update-secret");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer update-secret",
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).tempId).toBe(
      "preview-1",
    );
  });

  test("rejects a generated bundle without index.html before networking", async () => {
    await remove(Path.join(directory, "index.html"));
    const fetchMock = jest.fn();

    await expect(
      new TempMdClient({ fetch: fetchMock as never }).publish(
        directory,
        "My Game",
      ),
    ).rejects.toThrow("does not contain index.html");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("does not follow symbolic links", async () => {
    await symlink(
      Path.join(directory, "index.html"),
      Path.join(directory, "linked.html"),
    );
    await expect(collectTempPreviewFiles(directory)).rejects.toThrow(
      "containing links cannot be shared",
    );
  });

  test("rejects upload destinations outside the temp.md API origin", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      response({
        sessionId: "session-1",
        tempId: "preview-1",
        uploadToken: "upload-secret",
        uploads: [
          {
            path: "index.html",
            url: "https://example.com/upload",
            status: "expected",
          },
        ],
      }),
    );
    await expect(
      new TempMdClient({ fetch: fetchMock as never }).publish(
        directory,
        "My Game",
      ),
    ).rejects.toThrow("unexpected upload destination");
  });

  test("revokes a preview with its update capability", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ ok: true }));
    const current: TempPreviewRecord = {
      tempId: "preview-1",
      canonicalUrl: "https://preview-1.temp.md/",
      updateToken: "update-secret",
      expiresAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-08-25T00:00:00.000Z",
    };

    await new TempMdClient({ fetch: fetchMock as never }).revoke(current);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.temp.md/temps/preview-1",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer update-secret",
    );
  });
});
