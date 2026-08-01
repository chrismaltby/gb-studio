import fs from "fs-extra";
import { ProjectResources, SettingsResource } from "shared/lib/resources/types";

type ApplyConstantSettingsOptions = {
  settings: SettingsResource;
  outputRoot: string;
};

const writeSettingConstantToFile = async (
  file: string,
  fields: [
    {
      key: string;
      value: any;
    },
  ],
): Promise<void> => {
  const filename = file;
  let source = await fs.readFile(filename, "utf8");

  fields.forEach((engineField) => {
    source = source.replace(
      new RegExp(`#define[ \t]*${engineField.key}[^\n]*`),
      `#define ${engineField.key} ${engineField.value}`,
    );
  });
  await fs.writeFile(filename, source);
};

export const applyConstantSettings = async ({
  settings,
  outputRoot,
}: ApplyConstantSettingsOptions) => {
  await writeSettingConstantToFile(`${outputRoot}/include/input.h`, [
    {
      key: "MAX_JOYPADS",
      value: settings.sgbMaxJoypads,
    },
  ]);
};
