import { Token } from "shared/lib/compiler/lexText";
import {
  chunkTextOnWaitCodes,
  chunkTokensOnWaitCodes,
} from "shared/lib/text/textCodes";

describe("chunkTextOnWaitCodes", () => {
  test("should split text into chunks when wait codes are found", () => {
    const input = "hello!W:20s!world";
    const output = chunkTextOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          {
            type: "text",
            value: "world",
          },
        ],
      },
    ]);
  });

  test("should preserve newlines after waits when split text into chunks", () => {
    const input = "hello!W:20s!\nworld";
    const output = chunkTextOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          {
            type: "text",
            value: "\nworld",
          },
        ],
      },
    ]);
  });
});

describe("chunkTokensOnWaitCodes", () => {
  test("should split tokens into chunks when wait codes are found", () => {
    const input: Token[] = [
      { type: "text", value: "hello" },
      { type: "wait", time: 20, units: "time", frames: 1200 },
      { type: "text", value: "world" },
    ];
    const output = chunkTokensOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          {
            type: "text",
            value: "world",
          },
        ],
      },
    ]);
  });

  test("should preserve speed changes when chunking tokens", () => {
    const input: Token[] = [
      { type: "speed", speed: 2 },
      { type: "text", value: "hello" },
      { type: "wait", time: 20, units: "time", frames: 1200 },
      { type: "text", value: "world" },
    ];
    const output = chunkTokensOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          { type: "speed", speed: 2 },
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          { type: "speed", speed: 2 },
          {
            type: "text",
            value: "world",
          },
        ],
      },
    ]);
  });

  test("should preserve speed changes across multiple chunks", () => {
    const input: Token[] = [
      { type: "speed", speed: 2 },
      { type: "text", value: "hello" },
      { type: "wait", time: 20, units: "time", frames: 1200 },
      { type: "text", value: "world" },
      { type: "wait", time: 5, units: "frames", frames: 5 },
      { type: "text", value: "more" },
    ];
    const output = chunkTokensOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          { type: "speed", speed: 2 },
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          { type: "speed", speed: 2 },
          {
            type: "text",
            value: "world",
          },
        ],
        action: {
          type: "wait",
          time: 5,
          units: "frames",
          frames: 5,
        },
      },
      {
        tokens: [
          { type: "speed", speed: 2 },
          {
            type: "text",
            value: "more",
          },
        ],
      },
    ]);
  });

  test("should preserve only latest speed changes", () => {
    const input: Token[] = [
      { type: "speed", speed: 2 },
      { type: "text", value: "hello" },
      { type: "speed", speed: 4 },
      { type: "wait", time: 20, units: "time", frames: 1200 },
      { type: "text", value: "world" },
      { type: "wait", time: 5, units: "frames", frames: 5 },
      { type: "text", value: "more" },
    ];
    const output = chunkTokensOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          { type: "speed", speed: 2 },
          {
            type: "text",
            value: "hello",
          },
          { type: "speed", speed: 4 },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          { type: "speed", speed: 4 },
          {
            type: "text",
            value: "world",
          },
        ],
        action: {
          type: "wait",
          time: 5,
          units: "frames",
          frames: 5,
        },
      },
      {
        tokens: [
          { type: "speed", speed: 4 },
          {
            type: "text",
            value: "more",
          },
        ],
      },
    ]);
  });

  test("should preserve speed variable changes when chunking tokens", () => {
    const input: Token[] = [
      { type: "speedVariable", variableId: "3" },
      { type: "text", value: "hello" },
      { type: "wait", time: 20, units: "time", frames: 1200 },
      { type: "text", value: "world" },
    ];
    const output = chunkTokensOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          { type: "speedVariable", variableId: "3" },
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          { type: "speedVariable", variableId: "3" },
          {
            type: "text",
            value: "world",
          },
        ],
      },
    ]);
  });

  test("should preserve font changes when chunking tokens", () => {
    const input: Token[] = [
      { type: "font", fontId: "font1" },
      { type: "text", value: "hello" },
      { type: "wait", time: 20, units: "time", frames: 1200 },
      { type: "text", value: "world" },
    ];
    const output = chunkTokensOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          { type: "font", fontId: "font1" },
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          { type: "font", fontId: "font1" },
          {
            type: "text",
            value: "world",
          },
        ],
      },
    ]);
  });

  test("should preserve font variable changes when chunking tokens", () => {
    const input: Token[] = [
      { type: "fontVariable", variableId: "4" },
      { type: "text", value: "hello" },
      { type: "wait", time: 20, units: "time", frames: 1200 },
      { type: "text", value: "world" },
    ];
    const output = chunkTokensOnWaitCodes(input);
    expect(output).toEqual([
      {
        tokens: [
          { type: "fontVariable", variableId: "4" },
          {
            type: "text",
            value: "hello",
          },
        ],
        action: {
          type: "wait",
          time: 20,
          units: "time",
          frames: 1200,
        },
      },
      {
        tokens: [
          { type: "fontVariable", variableId: "4" },
          {
            type: "text",
            value: "world",
          },
        ],
      },
    ]);
  });
});
