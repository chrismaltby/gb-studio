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
  { onLog = () => {}, onError = () => {} }: SpawnLogFns,
) => {
  let code = 0;

  const child = childProcess.spawn(command, args, options);

  // Ensure consistent encoding
  child.stdout?.setEncoding("utf8");
  child.stderr?.setEncoding("utf8");

  let stdoutBuffer = "";
  let stderrBuffer = "";

  const processBuffer = (
    buffer: string,
    data: string,
    cb: (line: string) => void,
  ): string => {
    buffer += data;

    const lines = buffer.split(/\r?\n/);

    // Keep last partial line in buffer
    const remainder = lines.pop() ?? "";

    for (const line of lines) {
      cb(line);
    }

    return remainder;
  };

  child.stdout?.on("data", (data: string) => {
    stdoutBuffer = processBuffer(stdoutBuffer, data, onLog);
  });

  child.stderr?.on("data", (data: string) => {
    stderrBuffer = processBuffer(stderrBuffer, data, onError);
  });

  child.on("error", (err) => {
    onError(err.toString());
  });

  const completed = new Promise<void>((resolve, reject) => {
    child.on("close", (childCode) => {
      code = childCode ?? 0;

      // Flush remaining buffered content
      if (stdoutBuffer) onLog(stdoutBuffer);
      if (stderrBuffer) onError(stderrBuffer);

      if (code === 0) {
        resolve();
      } else {
        reject(code);
      }
    });
  });

  return {
    child,
    completed,
  };
};

export default spawn;
