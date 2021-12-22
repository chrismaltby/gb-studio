import {
  getPatchMaxBank,
  ObjectBankData,
  packObjectData,
  parseSize,
  parseSizes,
  replaceAllBanks,
  replaceBank,
  toCartSize,
  toOutputFilename,
} from "../../../src/lib/compiler/gbspack";

describe("Parse", () => {
  it("should parse area size", () => {
    const input = "A _CODE_3 size 8 flags 0 addr 0";
    const expectedOutput = { size: 8, bank: 3 };
    expect(parseSize(input)).toEqual(expectedOutput);
  });

  it("should parse area size hex", () => {
    const input = "A _CODE_15 size ff flags 0 addr 0";
    const expectedOutput = { size: 255, bank: 15 };
    expect(parseSize(input)).toEqual(expectedOutput);
  });

  it("should parse areas", () => {
    const input = `XL3
H 2 areas 5 global symbols
S b_wait_frames Ref000000
S .__.ABS. Def000000
S _wait_frames Ref000000
S ___bank_SCRIPT_3 Def0000FF
A _CODE size 0 flags 0 addr 0
A _CODE_5 size 5 flags 0 addr 0
A _CODE_255 size 55 flags 0 addr 0
S _SCRIPT_3 Def000000`;
    const expectedOutput: ObjectBankData[] = [
      { size: 5, bank: 5 },
      {
        size: 85,
        bank: 255,
      },
    ];
    const output = parseSizes(input);
    expect(output.length).toEqual(2);
    expect(output).toEqual(expectedOutput);
  });
});

describe("Replace", () => {
  it("should replace one bank", () => {
    const input = `XL3
H 2 areas 5 global symbols
S b_wait_frames Ref000000
S .__.ABS. Def000000
S _wait_frames Ref000000
S ___bank_SCRIPT_3 Def0000FF
A _CODE size 0 flags 0 addr 0
A _CODE_5 size 5 flags 0 addr 0
A _CODE_255 size 55 flags 0 addr 0
S _SCRIPT_3 Def000000`;

    const expectedOutput = `XL3
H 2 areas 5 global symbols
S b_wait_frames Ref000000
S .__.ABS. Def000000
S _wait_frames Ref000000
S ___bank_SCRIPT_3 Def00000F
A _CODE size 0 flags 0 addr 0
A _CODE_5 size 5 flags 0 addr 0
A _CODE_15 size 55 flags 0 addr 0
S _SCRIPT_3 Def000000`;

    expect(replaceBank(input, 255, 15)).toEqual(expectedOutput);
  });

  it("should replace multiple banks", () => {
    const input = `XL3
H 2 areas 5 global symbols
S b_wait_frames Ref000000
S .__.ABS. Def000000
S _wait_frames Ref000000
S ___bank_SCRIPT_3 Def0000FF
A _CODE size 0 flags 0 addr 0
A _CODE_5 size 5 flags 0 addr 0
A _CODE_255 size 55 flags 0 addr 0
S _SCRIPT_3 Def000000`;

    const expectedOutput = `XL3
H 2 areas 5 global symbols
S b_wait_frames Ref000000
S .__.ABS. Def000000
S _wait_frames Ref000000
S ___bank_SCRIPT_3 Def00000F
A _CODE size 0 flags 0 addr 0
A _CODE_14 size 5 flags 0 addr 0
A _CODE_15 size 55 flags 0 addr 0
S _SCRIPT_3 Def000000`;

    expect(replaceBank(replaceBank(input, 5, 14), 255, 15)).toEqual(
      expectedOutput
    );
  });

  it("should replace all banks", () => {
    const input = `XL3
H 2 areas 5 global symbols
S b_wait_frames Ref000000
S .__.ABS. Def000000
S _wait_frames Ref000000
S ___bank_SCRIPT_3 Def0000FF
S ___bank_SCRIPT_4 Def000005
A _CODE size 0 flags 0 addr 0
A _CODE_5 size 5 flags 0 addr 0
A _CODE_255 size 55 flags 0 addr 0
S _SCRIPT_3 Def000000`;

    const expectedOutput = `XL3
H 2 areas 5 global symbols
S b_wait_frames Ref000000
S .__.ABS. Def000000
S _wait_frames Ref000000
S ___bank_SCRIPT_3 Def000007
S ___bank_SCRIPT_4 Def000006
A _CODE size 0 flags 0 addr 0
A _CODE_6 size 5 flags 0 addr 0
A _CODE_7 size 55 flags 0 addr 0
S _SCRIPT_3 Def000000`;

    const patch = [
      { from: 5, to: 6 },
      { from: 255, to: 7 },
    ];

    expect(replaceAllBanks(input, patch)).toEqual(expectedOutput);
  });
});

describe("Cart Size", () => {
  it("should calculate cart sizes", () => {
    expect(toCartSize(5)).toEqual(8);
    expect(toCartSize(6)).toEqual(8);
    expect(toCartSize(7)).toEqual(8);
    expect(toCartSize(8)).toEqual(16);
    expect(toCartSize(31)).toEqual(32);
    expect(toCartSize(32)).toEqual(64);
    expect(toCartSize(33)).toEqual(64);
  });
});

describe("Filenames", () => {
  it("should construct output filenames", () => {
    expect(toOutputFilename("/a/b/c.o", "", "o")).toEqual("/a/b/c.o");
    expect(toOutputFilename("/a/b/c.o", "", "rel")).toEqual("/a/b/c.rel");
    expect(toOutputFilename("/a/b/c.o", "/d/e", "o")).toEqual("/d/e/c.o");
    expect(toOutputFilename("/a/b/c.o", "/d/e", "rel")).toEqual("/d/e/c.rel");
  });
});

describe("Pack", () => {
  it("should pack areas", () => {
    let input = [
      {
        filename: "a.o",
        contents: "hello world",
        banks: [
          { size: 5, bank: 1 },
          {
            size: 16380,
            bank: 255,
          },
        ],
      },
      {
        filename: "b.o",
        contents: "second file",
        banks: [
          { size: 15, bank: 2 },
          {
            size: 500,
            bank: 255,
          },
          {
            size: 40,
            bank: 255,
          },
        ],
      },
    ];
    const output = packObjectData(input, 255, 0, true);
    expect(output[0].filename).toEqual("a.o");
    expect(output[1].filename).toEqual("b.o");
    expect(output[0].replacements[0].from).toEqual(1);
    expect(output[0].replacements[0].to).toEqual(1);
    expect(output[0].replacements[1].from).toEqual(255);
    expect(output[0].replacements[1].to).toEqual(3);
    expect(output[1].replacements[0].from).toEqual(255);
    expect(output[1].replacements[0].to).toEqual(1);
    expect(output[1].replacements[1].from).toEqual(255);
    expect(output[1].replacements[1].to).toEqual(1);
    expect(output[1].replacements[2].from).toEqual(2);
    expect(output[1].replacements[2].to).toEqual(2);
  });

  it("should pack areas mbc1", () => {
    let input = [
      {
        filename: "a.o",
        contents: "hello world",
        banks: [
          { size: 5, bank: 1 },
          {
            size: 16380,
            bank: 255,
          },
        ],
      },
      {
        filename: "b.o",
        contents: "second file",
        banks: [
          { size: 15, bank: 2 },
          {
            size: 16380,
            bank: 255,
          },
          {
            size: 16380,
            bank: 255,
          },
        ],
      },
    ];
    let output = packObjectData(input, 255, 31, true);
    expect(output[0].filename).toEqual("a.o");
    expect(output[1].filename).toEqual("b.o");
    expect(output[0].replacements[0].from).toEqual(1);
    expect(output[0].replacements[0].to).toEqual(1);
    expect(output[0].replacements[1].from).toEqual(255);
    expect(output[0].replacements[1].to).toEqual(31);
    expect(output[1].replacements[0].from).toEqual(2);
    expect(output[1].replacements[0].to).toEqual(2);
    expect(output[1].replacements[1].from).toEqual(255);
    expect(output[1].replacements[1].to).toEqual(33);
    expect(output[1].replacements[2].from).toEqual(255);
    expect(output[1].replacements[2].to).toEqual(34);
  });

  it("should calculate max pack bank", () => {
    let input = [
      {
        filename: "a.o",
        contents: "hello world",
        banks: [
          { size: 5, bank: 1 },
          {
            size: 16380,
            bank: 255,
          },
        ],
      },
      {
        filename: "b.o",
        contents: "second file",
        banks: [
          { size: 15, bank: 2 },
          {
            size: 16380,
            bank: 255,
          },
          {
            size: 16380,
            bank: 255,
          },
        ],
      },
    ];
    let output = packObjectData(input, 255, 35, true);
    expect(getPatchMaxBank(output)).toEqual(37);
  });
});
