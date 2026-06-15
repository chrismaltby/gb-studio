import type {
  MusicDocumentReference,
  MusicWorkspace,
} from "shared/lib/music/workspace";
import { createMusicWorkspace } from "shared/lib/music/workspace";
import type {
  MusicEnvironment,
  MusicWorkspaceDocument,
} from "shared/lib/music/environment";
import l10n from "shared/lib/lang/l10n";

type MusicBinaryDocument = Uint8Array;

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle[]>;
    showDirectoryPicker?: () => Promise<
      FileSystemDirectoryHandle & {
        values(): AsyncIterable<FileSystemHandle>;
      }
    >;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

const musicExtensions = [".uge"];
const getNewSongBaseName = () => l10n("FIELD_NEW_SONG");
const accept = {
  description: "hUGETracker .uge",
  accept: {
    "application/octet-stream": [".uge"],
  },
};

const fileHandles = new Map<string, FileSystemFileHandle>();
const inMemoryDocuments = new Map<
  string,
  MusicWorkspaceDocument<MusicBinaryDocument>
>();
let currentDirectoryHandle:
  | (FileSystemDirectoryHandle & {
      values(): AsyncIterable<FileSystemHandle>;
    })
  | undefined;
let fallbackDocumentId = 0;

const resetMusicWorkspaceStorage = () => {
  fileHandles.clear();
  inMemoryDocuments.clear();
  currentDirectoryHandle = undefined;
  fallbackDocumentId = 0;
};

const isFileHandle = (
  handle: FileSystemHandle,
): handle is FileSystemFileHandle => handle.kind === "file";

const supportsFileOpenPicker = () =>
  typeof window !== "undefined" && "showOpenFilePicker" in window;

const supportsDirectoryPicker = () =>
  typeof window !== "undefined" && "showDirectoryPicker" in window;

const supportsSavePicker = () =>
  typeof window !== "undefined" && "showSaveFilePicker" in window;

const supportsFileSystemAccess = () =>
  supportsFileOpenPicker() && supportsDirectoryPicker() && supportsSavePicker();

const sortByName = <T extends { name: string }>(items: T[]) =>
  [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const getOpenFilePicker = () => {
  const picker = window.showOpenFilePicker;
  if (!picker) {
    throw new Error("Open file picker is not available.");
  }
  return picker;
};

const getDirectoryPicker = () => {
  const picker = window.showDirectoryPicker;
  if (!picker) {
    throw new Error("Directory picker is not available.");
  }
  return picker;
};

const getSaveFilePicker = () => {
  const picker = window.showSaveFilePicker;
  if (!picker) {
    throw new Error("Save file picker is not available.");
  }
  return picker;
};

const createReference = (
  name: string,
  filename: string,
  options?: { readonly?: boolean; id?: string },
): MusicDocumentReference => ({
  id: options?.id ?? filename,
  name,
  filename,
  format: "uge",
  readonly: options?.readonly,
});

const writeFileHandle = async (
  handle: FileSystemFileHandle,
  data: Uint8Array,
) => {
  const writable = await handle.createWritable();
  await writable.write(Uint8Array.from(data));
  await writable.close();
};

const cloneBytes = (data: Uint8Array) => Uint8Array.from(data);

const storeInMemoryDocument = (
  meta: MusicDocumentReference,
  data: Uint8Array,
  modified = false,
) => {
  const storedDocument = {
    meta,
    data: cloneBytes(data),
    modified,
  };
  inMemoryDocuments.set(meta.filename, storedDocument);
  return storedDocument;
};

export const downloadBytes = (filename: string, data: Uint8Array) => {
  const blob = new Blob([Uint8Array.from(data)], {
    type: "application/octet-stream",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const openFilesWithInput = async (options?: {
  multiple?: boolean;
  directory?: boolean;
}) =>
  new Promise<File[]>((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = musicExtensions.join(",");
    input.multiple = options?.multiple ?? false;
    if (options?.directory) {
      input.setAttribute("webkitdirectory", "");
    }
    input.onchange = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
      resolve(Array.from(input.files ?? []));
    };
    input.oncancel = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    document.body.appendChild(input);
    input.click();
  });

const toReferenceFilename = (file: File) => {
  const relativePath =
    typeof file.webkitRelativePath === "string" &&
    file.webkitRelativePath.length > 0
      ? file.webkitRelativePath
      : file.name;
  // if (workspace?.openMode === "directory" && workspace.rootName) {
  //   return `${workspace.rootName}/${relativePath.split("/").pop() || file.name}`;
  // }
  return relativePath;
};

const registerHandleReference = (handle: FileSystemFileHandle) => {
  const reference = createReference(handle.name, handle.name);
  fileHandles.set(reference.filename, handle);
  return reference;
};

const registerFallbackFileReference = async (file: File) => {
  const filename = toReferenceFilename(file);
  const id = `fallback-${fallbackDocumentId++}-${filename}`;
  const reference = createReference(file.name, filename, { id });
  storeInMemoryDocument(reference, new Uint8Array(await file.arrayBuffer()));
  return reference;
};

const findAvailableSongName = async (
  directoryHandle: FileSystemDirectoryHandle,
  baseName: string = getNewSongBaseName(),
) => {
  let index = 0;
  while (true) {
    const candidate =
      index === 0 ? `${baseName}.uge` : `${baseName} ${index + 1}.uge`;
    try {
      await directoryHandle.getFileHandle(candidate);
      index += 1;
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        return candidate;
      }
      throw error;
    }
  }
};

const createFallbackNewSongReference = (
  baseName: string = getNewSongBaseName(),
) => {
  const suffix = fallbackDocumentId++ || 0;
  const fileName =
    suffix === 0 ? `${baseName}.uge` : `${baseName} ${suffix + 1}.uge`;
  const reference = createReference(fileName.replace(/\.uge$/, ""), fileName, {
    id: `fallback-new-${suffix}-${fileName}`,
  });
  return reference;
};

export const pickUGIFile = async (): Promise<Uint8Array | null> => {
  const ugiAccept = {
    description: "hUGETracker .ugi",
    accept: { "application/octet-stream": [".ugi"] },
  };
  try {
    if (supportsFileOpenPicker()) {
      const [handle] = await getOpenFilePicker()({
        multiple: false,
        types: [ugiAccept],
      });
      if (!handle) {
        return null;
      }
      const file = await handle.getFile();
      return new Uint8Array(await file.arrayBuffer());
    }

    const data = await new Promise<Uint8Array | null>((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".ugi";
      input.onchange = async () => {
        if (input.parentNode) input.parentNode.removeChild(input);
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        resolve(new Uint8Array(await file.arrayBuffer()));
      };
      input.oncancel = () => {
        if (input.parentNode) input.parentNode.removeChild(input);
        reject(new DOMException("The operation was aborted.", "AbortError"));
      };
      document.body.appendChild(input);
      input.click();
    });
    return data;
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }
    throw error;
  }
};

export const pickUGWFile = async (): Promise<Uint8Array | null> => {
  const ugwAccept = {
    description: "hUGETracker .ugw",
    accept: { "application/octet-stream": [".ugw"] },
  };
  try {
    if (supportsFileOpenPicker()) {
      const [handle] = await getOpenFilePicker()({
        multiple: false,
        types: [ugwAccept],
      });
      if (!handle) {
        return null;
      }
      const file = await handle.getFile();
      return new Uint8Array(await file.arrayBuffer());
    }

    const data = await new Promise<Uint8Array | null>((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".ugw";
      input.onchange = async () => {
        if (input.parentNode) input.parentNode.removeChild(input);
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        resolve(new Uint8Array(await file.arrayBuffer()));
      };
      input.oncancel = () => {
        if (input.parentNode) input.parentNode.removeChild(input);
        reject(new DOMException("The operation was aborted.", "AbortError"));
      };
      document.body.appendChild(input);
      input.click();
    });
    return data;
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }
    throw error;
  }
};

export const webMusicEnvironment: MusicEnvironment<MusicBinaryDocument> = {
  confirmDiscardChanges: async () => "discard",
  setWindowTitle: (title) => {
    document.title = title;
  },
  openFileWorkspace: async () => {
    if (supportsFileOpenPicker()) {
      const [handle] = await getOpenFilePicker()({
        multiple: false,
        types: [accept],
      });
      if (!handle) {
        throw new Error("Unable to get file handle");
      }
      currentDirectoryHandle = undefined;
      const reference = registerHandleReference(handle);
      return createMusicWorkspace({
        source: "browser",
        openMode: "file",
        activeDocumentId: reference.id,
        documents: [reference],
      });
    }

    const [file] = await openFilesWithInput({ multiple: false });
    if (!file) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    currentDirectoryHandle = undefined;
    const reference = await registerFallbackFileReference(file);
    return createMusicWorkspace({
      source: "browser",
      openMode: "file",
      activeDocumentId: reference.id,
      documents: [reference],
    });
  },
  openDirectoryWorkspace: async () => {
    if (supportsDirectoryPicker()) {
      const directoryHandle = await getDirectoryPicker()();
      currentDirectoryHandle = directoryHandle;
      const documents: MusicDocumentReference[] = [];
      for await (const entry of directoryHandle.values()) {
        if (
          isFileHandle(entry) &&
          musicExtensions.some((extension) =>
            entry.name.toLowerCase().endsWith(extension),
          )
        ) {
          const filename = `${entry.name}`;
          const reference = createReference(entry.name, filename);
          documents.push(reference);
          fileHandles.set(reference.filename, entry);
        }
      }
      const sortedDocuments = sortByName(documents);
      return createMusicWorkspace({
        source: "browser",
        openMode: "directory",
        rootName: directoryHandle.name,
        activeDocumentId: sortedDocuments[0]?.id,
        documents: sortedDocuments,
      });
    }
    throw new Error("openDirectoryWorkspace not supported");
  },
  loadDocument: async (document) => {
    const handle = fileHandles.get(document.filename);
    if (handle) {
      const file = await handle.getFile();
      return {
        meta: document,
        data: new Uint8Array(await file.arrayBuffer()),
        modified: false,
      };
    }

    const fallbackDocument = inMemoryDocuments.get(document.filename);
    if (!fallbackDocument) {
      throw new Error(
        `Document data for ${document.filename} is not available.`,
      );
    }

    return {
      ...fallbackDocument,
      meta: document,
      data: cloneBytes(fallbackDocument.data),
    };
  },
  saveDocument: async (document) => {
    const handle = fileHandles.get(document.meta.filename);
    if (handle) {
      await writeFileHandle(handle, document.data);
      storeInMemoryDocument(document.meta, document.data, false);
      return;
    }

    storeInMemoryDocument(document.meta, document.data, false);
    downloadBytes(
      document.meta.filename.split("/").pop() || document.meta.name,
      document.data,
    );
  },
  saveDocumentAs: async (document) => {
    if (supportsSavePicker()) {
      const handle = await getSaveFilePicker()({
        suggestedName:
          document.meta.filename.split("/").pop() || document.meta.name,
        types: [accept],
      });
      await writeFileHandle(handle, document.data);
      const file = await handle.getFile();
      const meta = createReference(file.name, file.name);
      fileHandles.set(meta.filename, handle);
      storeInMemoryDocument(meta, document.data, false);
      return {
        ...document,
        meta,
        modified: false,
      };
    }

    const filename =
      document.meta.filename.split("/").pop() || document.meta.name;
    const fallbackMeta = createReference(
      filename.replace(/\.[^.]+$/, ""),
      filename,
      { id: document.meta.id },
    );
    storeInMemoryDocument(fallbackMeta, document.data, false);
    downloadBytes(filename, document.data);
    return {
      ...document,
      meta: fallbackMeta,
      modified: false,
    };
  },
};

export const importMusicDocument =
  async (): Promise<MusicDocumentReference | null> => {
    try {
      if (supportsFileOpenPicker()) {
        const [handle] = await getOpenFilePicker()({
          multiple: false,
          types: [accept],
        });
        if (!handle) {
          return null;
        }
        return registerHandleReference(handle);
      }

      const [file] = await openFilesWithInput({ multiple: false });
      if (!file) {
        return null;
      }
      return registerFallbackFileReference(file);
    } catch (error) {
      if (isAbortError(error)) {
        return null;
      }
      throw error;
    }
  };

export const createTemplateMusicDocument = async (
  data: Uint8Array,
  workspace?: Pick<MusicWorkspace, "openMode" | "rootName">,
  suggestedBaseName?: string,
): Promise<MusicDocumentReference | null> => {
  const baseName = suggestedBaseName || getNewSongBaseName();
  try {
    if (
      workspace?.openMode === "directory" &&
      currentDirectoryHandle &&
      supportsFileSystemAccess()
    ) {
      const filename = await findAvailableSongName(
        currentDirectoryHandle,
        baseName,
      );
      const handle = await currentDirectoryHandle.getFileHandle(filename, {
        create: true,
      });
      await writeFileHandle(handle, data);
      const reference = registerHandleReference(handle);
      storeInMemoryDocument(reference, data, false);
      return reference;
    }

    if (supportsSavePicker()) {
      const handle = await getSaveFilePicker()({
        suggestedName: `${baseName}.uge`,
        types: [accept],
      });
      await writeFileHandle(handle, data);
      currentDirectoryHandle = undefined;
      const reference = registerHandleReference(handle);
      storeInMemoryDocument(reference, data, false);
      return reference;
    }

    const reference = createFallbackNewSongReference(baseName);
    storeInMemoryDocument(reference, data, false);
    currentDirectoryHandle = undefined;
    return reference;
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }
    throw error;
  }
};

export const supportsDirectoryOpen = () =>
  supportsDirectoryPicker() ||
  "webkitdirectory" in document.createElement("input");

export const supportsPersistentSave = () => supportsSavePicker();

export const renameWebDocument = async (
  musicId: string,
  oldFilename: string,
  newFilename: string,
): Promise<MusicDocumentReference> => {
  if (currentDirectoryHandle && fileHandles.has(oldFilename)) {
    // Directory mode: rename the actual file on disk
    const oldHandle = fileHandles.get(oldFilename);
    if (oldHandle) {
      const oldFile = await oldHandle.getFile();
      const data = new Uint8Array(await oldFile.arrayBuffer());

      const newHandle = await currentDirectoryHandle.getFileHandle(
        newFilename,
        {
          create: true,
        },
      );
      await writeFileHandle(newHandle, data);
      await currentDirectoryHandle.removeEntry(oldFilename);

      fileHandles.delete(oldFilename);
      fileHandles.set(newFilename, newHandle);

      const inMemDoc = inMemoryDocuments.get(oldFilename);
      if (inMemDoc) {
        const newMeta = createReference(
          newFilename.replace(/\.[^.]+$/, ""),
          newFilename,
          { id: musicId },
        );
        inMemoryDocuments.delete(oldFilename);
        inMemoryDocuments.set(newFilename, {
          ...inMemDoc,
          meta: newMeta,
        });
      }
    }
  } else if (fileHandles.has(oldFilename)) {
    // Single-file handle mode: re-key the handle (actual file path on disk is preserved)
    const handle = fileHandles.get(oldFilename);
    if (handle) {
      fileHandles.delete(oldFilename);
      fileHandles.set(newFilename, handle);

      const inMemDoc = inMemoryDocuments.get(oldFilename);
      if (inMemDoc) {
        const newMeta = createReference(
          newFilename.replace(/\.[^.]+$/, ""),
          newFilename,
          { id: musicId },
        );
        inMemoryDocuments.delete(oldFilename);
        inMemoryDocuments.set(newFilename, {
          ...inMemDoc,
          meta: newMeta,
        });
      }
    }
  } else {
    // In-memory only (single document mode / fallback)
    const inMemDoc = inMemoryDocuments.get(oldFilename);
    if (inMemDoc) {
      const newMeta = createReference(
        newFilename.replace(/\.[^.]+$/, ""),
        newFilename,
        { id: musicId },
      );
      inMemoryDocuments.delete(oldFilename);
      inMemoryDocuments.set(newFilename, {
        ...inMemDoc,
        meta: newMeta,
      });
    }
  }

  return createReference(newFilename.replace(/\.[^.]+$/, ""), newFilename, {
    id: musicId,
  });
};

/**
 * Registers raw UGE binary data as an in-memory document so the normal
 * loadDocument / loadSongFile path can read it back without touching the
 * file system.  Returns the MusicDocumentReference needed to build a workspace.
 */
export const registerSongBackupData = (
  data: Uint8Array,
  name: string,
  filename: string,
): MusicDocumentReference => {
  const reference = createReference(name, filename, {
    id: `backup-${filename}`,
  });
  storeInMemoryDocument(reference, data);
  return reference;
};

/**
 * Registers a pre-fetched UGE example binary as an in-memory document.
 */
export const registerExampleData = (
  data: Uint8Array,
  name: string,
  filename: string,
): MusicDocumentReference => {
  const reference = createReference(name, filename, {
    id: `example-${filename}`,
  });
  storeInMemoryDocument(reference, data);
  return reference;
};

export const resetMusicWorkspaceAdapterState = () => {
  resetMusicWorkspaceStorage();
};
