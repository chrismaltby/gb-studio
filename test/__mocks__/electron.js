module.exports = {
  app: {
    whenReady: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
    quit: jest.fn(),
    getPath: jest.fn().mockReturnValue("/path/to/documents"),
    addRecentDocument: jest.fn(),
    clearRecentDocuments: jest.fn(),
    getLocale: jest.fn().mockReturnValue("en"),
  },
  BrowserWindow: jest.fn(),
  dialog: {
    showMessageBoxSync: jest.fn().mockReturnValue(0),
    showOpenDialogSync: jest.fn().mockReturnValue(["/path/to/project.gbsproj"]),
    showErrorBox: jest.fn(),
    showSaveDialogSync: jest
      .fn()
      .mockReturnValue("/path/to/saveAsProject.gbsproj"),
  },
  shell: {
    openPath: jest.fn(),
    openExternal: jest.fn(),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  nativeTheme: {
    shouldUseDarkColors: false,
    on: jest.fn(),
  },
  clipboard: {
    readText: jest.fn(),
    readBuffer: jest.fn(),
    writeText: jest.fn(),
    writeBuffer: jest.fn(),
  },
  protocol: {
    registerSchemesAsPrivileged: jest.fn(),
    registerFileProtocol: jest.fn(),
  },
};
