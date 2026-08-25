import { createHash, randomUUID } from "crypto";
import { readdir, readFile } from "fs-extra";
import fetch, { RequestInit, Response } from "node-fetch";
import Path from "path";

const DEFAULT_BASE_URL = "https://api.temp.md";
const CLIENT_IDENTITY = "gb-studio/temp-preview";
const MAX_FILES = 100;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 50 * 1024 * 1024;
const MAX_PATH_CHARACTERS = 512;
const MAX_PATH_DEPTH = 20;
const RESERVED_PATHS = new Set(["manifest.json"]);
const RESERVED_PREFIXES = ["__v/", "__tempmd/"];

export type TempPreviewRecord = {
  tempId: string;
  canonicalUrl: string;
  updateToken: string;
  expiresAt: string | null;
  updatedAt: string;
};

type PreparedFile = {
  path: string;
  size: number;
  contentType: string;
  hash: string;
  body: Buffer;
};

type SessionUpload = {
  path: string;
  url: string;
  status: "expected" | "uploaded";
};

type PublishSession = {
  sessionId: string;
  tempId: string;
  uploadToken: string;
  uploads: SessionUpload[];
};

type FinalizedPublish = {
  tempId: string;
  canonicalUrl: string;
  updateToken?: string;
  expiresAt: string | null;
};

type Fetch = typeof fetch;

export class TempMdApiError extends Error {
  override readonly name = "TempMdApiError";

  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(message);
  }
}

export class TempMdClient {
  private readonly baseUrl: string;
  private readonly fetcher: Fetch;

  constructor(options: { baseUrl?: string; fetch?: Fetch } = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetcher = options.fetch ?? fetch;
  }

  async publish(
    directory: string,
    title: string,
    current?: TempPreviewRecord,
  ): Promise<TempPreviewRecord> {
    const files = await collectTempPreviewFiles(directory);
    const session = await this.json<PublishSession>("/publish-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
        ...(current ? { Authorization: `Bearer ${current.updateToken}` } : {}),
      },
      body: JSON.stringify({
        title: validateTitle(title),
        spaMode: false,
        ...(current ? { tempId: current.tempId } : {}),
        files: files.map(({ path, size, contentType, hash }) => ({
          path,
          size,
          contentType,
          hash,
        })),
      }),
    });

    const filesByPath = new Map(files.map((file) => [file.path, file]));
    const outstanding = session.uploads.filter(
      (upload) => upload.status === "expected",
    );

    await runConcurrently(outstanding, 4, async (upload) => {
      const file = filesByPath.get(upload.path);
      if (!file) {
        throw new Error(
          `The publish session requested an unknown file: ${upload.path}`,
        );
      }
      await this.upload(session, upload, file);
    });

    const finalized = await this.json<FinalizedPublish>(
      `/publish-sessions/${encodeURIComponent(session.sessionId)}/finalize`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.uploadToken}` },
      },
    );
    const updateToken = finalized.updateToken ?? current?.updateToken;
    if (!updateToken) {
      throw new Error("temp.md did not return an update capability.");
    }
    const canonicalUrl = validateCanonicalUrl(finalized.canonicalUrl);
    if (!finalized.tempId) {
      throw new Error("temp.md returned an incomplete preview response.");
    }

    return {
      tempId: finalized.tempId,
      canonicalUrl,
      updateToken,
      expiresAt: finalized.expiresAt,
      updatedAt: new Date().toISOString(),
    };
  }

  async revoke(record: TempPreviewRecord): Promise<void> {
    await this.json(`/temps/${encodeURIComponent(record.tempId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${record.updateToken}` },
    });
  }

  private async upload(
    session: PublishSession,
    target: SessionUpload,
    file: PreparedFile,
  ): Promise<void> {
    const uploadUrl = new URL(target.url);
    if (uploadUrl.origin !== new URL(this.baseUrl).origin) {
      throw new Error("temp.md returned an unexpected upload destination.");
    }
    const headers = {
      Authorization: `Bearer ${session.uploadToken}`,
      "Content-Type": file.contentType,
      "X-Tempmd-Client": CLIENT_IDENTITY,
    };
    const response = await this.fetcher(uploadUrl, {
      method: "PUT",
      headers,
      body: file.body,
      redirect: "error",
    });
    if (!response.ok) {
      throw await toApiError(response, `Upload failed for ${file.path}.`);
    }
  }

  private async json<T>(path: string, init: RequestInit): Promise<T> {
    const headers = {
      ...(init.headers as Record<string, string> | undefined),
      "X-Tempmd-Client": CLIENT_IDENTITY,
    };
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      redirect: "error",
    });
    if (!response.ok) {
      throw await toApiError(response, "The temp.md request failed.");
    }
    return (await response.json()) as T;
  }
}

export const collectTempPreviewFiles = async (
  root: string,
): Promise<PreparedFile[]> => {
  const files: PreparedFile[] = [];
  let totalBytes = 0;

  const visit = async (directory: string, relativeDirectory: string) => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const absolutePath = Path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(
          `Web builds containing links cannot be shared: ${relativePath}`,
        );
      }
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(
          `Web builds containing special files cannot be shared: ${relativePath}`,
        );
      }
      validatePath(relativePath);
      const body = await readFile(absolutePath);
      if (body.byteLength > MAX_FILE_BYTES) {
        throw new Error(
          `${relativePath} exceeds the 10 MiB preview file limit.`,
        );
      }
      totalBytes += body.byteLength;
      if (totalBytes > MAX_BUNDLE_BYTES) {
        throw new Error("The web build exceeds the 50 MiB preview limit.");
      }
      files.push({
        path: relativePath,
        size: body.byteLength,
        contentType: inferContentType(relativePath),
        hash: createHash("sha256").update(body).digest("hex"),
        body,
      });
      if (files.length > MAX_FILES) {
        throw new Error("A temporary preview can contain at most 100 files.");
      }
    }
  };

  await visit(root, "");
  if (!files.some((file) => file.path === "index.html")) {
    throw new Error("The generated web build does not contain index.html.");
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
};

const validatePath = (path: string): void => {
  const lowerPath = path.toLowerCase();
  const segments = path.split("/");
  if (
    !path ||
    path.length > MAX_PATH_CHARACTERS ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.includes("\\") ||
    hasControlCharacters(path) ||
    segments.length > MAX_PATH_DEPTH ||
    segments.some(
      (segment) =>
        !segment || segment === "." || segment === ".." || segment.length > 255,
    ) ||
    RESERVED_PATHS.has(lowerPath) ||
    RESERVED_PREFIXES.some((prefix) => lowerPath.startsWith(prefix))
  ) {
    throw new Error(`The web build contains an unsafe preview path: ${path}`);
  }
};

const inferContentType = (path: string): string => {
  const extension = Path.extname(path).slice(1).toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "text/javascript",
    mjs: "text/javascript",
    json: "application/json",
    wasm: "application/wasm",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    txt: "text/plain",
    xml: "application/xml",
    webmanifest: "application/manifest+json",
  };
  return types[extension] ?? "application/octet-stream";
};

const validateTitle = (value: string): string => {
  const title = value.trim();
  if (!title || title.length > 120 || hasControlCharacters(title)) {
    throw new Error("Preview titles must be 1 to 120 characters.");
  }
  return title;
};

const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const validateCanonicalUrl = (value: string): string => {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !(url.hostname === "temp.md" || url.hostname.endsWith(".temp.md"))
  ) {
    throw new Error("temp.md returned an unexpected preview URL.");
  }
  return url.toString();
};

const runConcurrently = async <T>(
  values: readonly T[],
  concurrency: number,
  worker: (value: T) => Promise<void>,
): Promise<void> => {
  let next = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (next < values.length) {
        const index = next++;
        await worker(values[index]);
      }
    },
  );
  await Promise.all(runners);
};

const toApiError = async (
  response: Response,
  fallbackMessage: string,
): Promise<TempMdApiError> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const record = isRecord(body) ? body : undefined;
  const message =
    typeof record?.message === "string"
      ? record.message
      : typeof record?.error === "string"
        ? record.error
        : fallbackMessage;
  const code =
    typeof record?.code === "string" ? record.code : "request_failed";
  const requestId = response.headers.get("X-Request-Id") ?? undefined;
  return new TempMdApiError(message, response.status, code, requestId);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
