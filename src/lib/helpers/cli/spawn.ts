import childProcess from "child_process";

export type ChildProcess = childProcess.ChildProcess;

interface SpawnLogFns {
  onLog?: (msg: string) => void;
  onError?: (msg: string) => void;
}

const spawn = (
  command: string,
  args: string[],
  options: childProcess.SpawnOptions,
  { onLog = () => {}, onError = () => {} }: SpawnLogFns
) => {
  let complete = false;
  let code = 0;

  const child = childProcess.spawn(command, args, options);

  child.on("error", (err) => {
    onError(err.toString());
  });

  child.stdout?.on("data", (childData: string) => {
    const lines = childData.toString().split("\n");
    lines.forEach((line, lineIndex) => {
      if (line.length === 0 && lineIndex === lines.length - 1) {
        return;
      }
      onLog && onLog(line);
    });
  });

  child.stderr?.on("data", (childData: string) => {
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
    completed: new Promise<void>((resolve, reject) => {
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
