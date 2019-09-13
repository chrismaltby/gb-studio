import { readFile, unlink } from "fs-extra";
import {
  writeFileAndFlush,
  writeFileAndFlushAsync
} from "../../../src/lib/helpers/fs/writeFileAndFlush";

test("Should write file correctly using callbacks", done => {
  const data = "Testing 123";
  const path = `${__dirname}/tmp_data1.txt`;
  writeFileAndFlush(path, data, writeError => {
    expect(writeError).toBeFalsy();
    readFile(path, "utf8", (readError, savedData) => {
      expect(readError).toBeFalsy();
      expect(savedData).toBe(data);
      unlink(path, unlinkError => {
        expect(unlinkError).toBeFalsy();
        done();
      });
    });
  });
});

test("Should write file correctly using promises", async () => {
  const data = "Testing 456";
  const path = `${__dirname}/tmp_data2.txt`;
  await writeFileAndFlushAsync(path, data);
  const savedData = await readFile(path, "utf8");
  expect(savedData).toBe(data);
  await unlink(path);
});

test("Should allow setting file encoding", async () => {
  const data = "Testing 789";
  const path = `${__dirname}/tmp_data3.txt`;
  await writeFileAndFlushAsync(path, data, "utf8");
  const savedData = await readFile(path, "utf8");
  expect(savedData).toBe(data);
  await unlink(path);
});
