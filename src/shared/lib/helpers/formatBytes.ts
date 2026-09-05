export const bytesToHumanReadable = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${parseFloat(kb.toFixed(2))} KiB`;
  }

  const mb = bytes / (1024 * 1024);
  return `${parseFloat(mb.toFixed(2))} MiB`;
};
