import { readFile, unlink } from "fs-extra";
import { writeFileWithBackupAsync } from "../../../src/lib/helpers/fs/writeFileWithBackup";

test("Should write file correctly on first save", async () => {
  const data = "Testing Backup 123";
  const path = `${__dirname}/tmp_data_bak_1.txt`;
  await writeFileWithBackupAsync(path, data);
  const savedData = await readFile(path, "utf8");
  expect(savedData).toBe(data);
  await unlink(path);
});

test("Should store backup of previous store in .bak file", async () => {
  const data = "Testing Backup 456";
  const updatedData = "Testing Backup UPDATED";
  const path = `${__dirname}/tmp_data_bak_2.txt`;
  await writeFileWithBackupAsync(path, data);
  const savedData = await readFile(path, "utf8");
  expect(savedData).toBe(data);
  await writeFileWithBackupAsync(path, updatedData);
  const savedData2 = await readFile(path, "utf8");
  const backupData = await readFile(`${path}.bak`, "utf8");
  expect(savedData2).toBe(updatedData);
  expect(backupData).toBe(data);
  await unlink(path);
  await unlink(`${path}.bak`);
});
