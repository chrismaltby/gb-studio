import childProcess from "child_process";

const spawn = (
  command,
  args,
  options,
  { onLog = () => {}, onError = () => {} }
) => {
  let output = "";
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, options, {
      encoding: "utf8",
    });

    child.on("error", (err) => {
      onError(err.toString());
    });

    child.stdout.on("data", (childData) => {
      output += childData;
      const lines = childData.toString().split("\n");
      lines.forEach((line, lineIndex) => {
        if (line.length === 0 && lineIndex === lines.length - 1) {
          return;
        }
        try {
          onLog(line);
        } catch (e) {
          child.kill();
          return reject(e);
        }
      });
    });

    child.stderr.on("data", (childData) => {
      const lines = childData.toString().split("\n");
      lines.forEach((line, lineIndex) => {
        if (line.length === 0 && lineIndex === lines.length - 1) {
          return;
        }
        onError(line);
      });
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        return reject(code);
      }
      resolve(output.trim());
    });
  });
};

export default spawn;
