import childProcess from "child_process";

const spawn = (
  command,
  args,
  options,
  { onLog = () => {}, onError = () => {} }
) => {
  let complete = false;
  let code = 0;

  const child = childProcess.spawn(command, args, options, {
    encoding: "utf8",
  });

  child.on("error", (err) => {
    onError(err.toString());
  });

  child.stdout.on("data", (childData) => {
    const lines = childData.toString().split("\n");
    lines.forEach((line, lineIndex) => {
      if (line.length === 0 && lineIndex === lines.length - 1) {
        return;
      }
      onLog && onLog(line);
    });
  });

  child.stderr.on("data", (childData) => {
    const lines = childData.toString().split("\n");
    lines.forEach((line, lineIndex) => {
      if (line.length === 0 && lineIndex === lines.length - 1) {
        return;
      }
      onError && onError(line);
    });
  });

  child.on("close", async (childCode) => {
    complete = true;
    code = childCode;
  });

  return {
    child,
    completed: new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (complete) {
          clearInterval(interval);
          if (code === 0) {
            resolve();
          } else {
            reject(code);
          }
        }
      }, 10);
    }),
  };
};

export default spawn;
