export const monoOverrideForFilename = (filename: string) =>
  filename.replace(/(.png)$/i, ".mono$1");

export const isMonoOverride = (filename: string) =>
  !!filename.match(/\.mono\.png$/i);
