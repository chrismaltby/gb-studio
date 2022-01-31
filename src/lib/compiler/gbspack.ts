import fs from "fs";
import Path from "path";

interface PackArgs {
  bankOffset?: number; // Sets the first bank to use (default 1)
  outputPath?: string;
  filter?: number; // Only repack files from specified bank (default repack all banks)
  extension?: string; // Replace the file extension for output files
  mbc1?: boolean; // Use MBC1 hardware (skip banks 0x20, 0x40 and 0x60)
  additional?: number; // Reserve N additional banks at end of cart for batteryless saving (default 0)
  verbose?: boolean;
}

interface PackResult {
  cartSize: number;
  maxBank: number;
}

export interface ObjectBankData {
  size: number;
  bank: number;
}

export interface ObjectData {
  banks: ObjectBankData[];
  filename: string;
  contents: string;
}

export interface BankReplacement {
  from: number;
  to: number;
}

export interface Bank {
  objects: [number, ObjectBankData][];
}

export interface ObjectPatch {
  filename: string;
  contents: string;
  replacements: BankReplacement[];
}

const BANK_SIZE = 16384;

const toHex = (value: number, length: number): string => {
  return value.toString(16).toUpperCase().padStart(length, "0");
};

export const parseSize = (line: string): ObjectBankData => {
  const split = line.split(" ");
  const bankSplit = split[1].split("_");
  const size = parseInt(split[3], 16);
  const bank = parseInt(bankSplit[2]);
  return { size, bank };
};

export const parseSizes = (contents: string): ObjectBankData[] => {
  const banks: ObjectBankData[] = [];
  const lines = contents.split("\n");
  for (const line of lines) {
    if (line.includes("A _CODE_")) {
      const parsedSize = parseSize(line);
      banks.push(parsedSize);
    }
  }
  return banks;
};

export const replaceBank = (
  objectString: string,
  originalBank: number,
  bankNo: number
): string => {
  let newString = objectString;
  const lines = objectString.split("\n");

  // Find banked functions
  for (const line of lines) {
    if (line.startsWith("S b_")) {
      const split = line.substring(4).split(" ");
      const fnName = split[0];
      const fnDef = `S _${fnName}`;
      // If symbol has pair
      if (newString.includes(fnDef)) {
        const findBankedFnDef = `b_${fnName} Def${toHex(originalBank, 6)}`;
        const replaceBankedFnDef = `b_${fnName} Def${toHex(bankNo, 6)}`;
        newString = newString.replace(
          new RegExp(findBankedFnDef, "g"),
          replaceBankedFnDef
        );
      }
    }
  }

  const findCode = `CODE_${originalBank}`;
  const replaceCode = `CODE_${bankNo}`;
  const replacedString = newString.replace(
    new RegExp(findCode, "g"),
    replaceCode
  );
  const re = new RegExp(`__bank_([^ ]*) Def${toHex(originalBank, 6)}`, "g");
  const result = replacedString.replace(re, (_, capture) => {
    return `__bank_${capture} Def${toHex(bankNo, 6)}`;
  });

  return result;
};

export const replaceAllBanks = (
  objectString: string,
  replacements: BankReplacement[]
): string => {
  return replacements.reduce((memo, replacement) => {
    return replaceBank(memo, replacement.from, replacement.to);
  }, objectString);
};

export const toCartSize = (maxBank: number): number => {
  const power = Math.ceil(Math.log(maxBank + 1) / Math.log(2));
  return Math.pow(2, power);
};

export const toOutputFilename = (
  originalFilename: string,
  outputPath: string,
  ext: string
): string => {
  const fileStem = Path.basename(originalFilename).replace(/\.[^.]*/, "");
  const newFilename = `${fileStem}.${ext}`;
  if (outputPath.length > 0) {
    // Store output in dir specified by output_path
    return Path.join(outputPath, newFilename);
  } else {
    return Path.join(Path.dirname(originalFilename), newFilename);
  }
};

const getBankReplacements = (
  index: number,
  packed: Bank[],
  mbc1: boolean
): BankReplacement[] => {
  const replacements: BankReplacement[] = [];

  // Write packed files back to disk
  let bankNo = 1;
  for (const bin of packed) {
    for (const object of bin.objects) {
      if (mbc1) {
        if (bankNo === 0x20 || bankNo === 0x40 || bankNo === 0x60) {
          bankNo += 1;
        }
      }
      if (object[0] === index) {
        replacements.push({
          from: object[1].bank,
          to: bankNo,
        });
      }
    }
    bankNo += 1;
  }

  return replacements;
};

export const packObjectData = (
  objects: ObjectData[],
  filter: number,
  bankOffset: number,
  mbc1: boolean
): ObjectPatch[] => {
  const banks: Bank[] = [];

  const areas: [number, ObjectBankData][] = objects
    .map((x, i) => x.banks.map((y) => [i, y] as [number, ObjectBankData]))
    .flat();

  // Sort objects by descending size
  areas.sort((a, b) => {
    if (b[1].size > a[1].size) {
      return 1;
    } else if (b[1].size < a[1].size) {
      return -1;
    }
    return 0;
  });

  const maxSize = Math.max(...areas.map((a) => a[1].size));

  if (BANK_SIZE < maxSize) {
    const oversizedObjects = objects
      .filter((object) => {
        return object.banks.some((bank) => bank.size > BANK_SIZE);
      })
      .map((object) => `    ${Path.basename(object.filename)}`)
      .join("\n");
    throw new Error(
      `Object files too large to fit in bank.\n${oversizedObjects}`
    );
  }

  // Add the extra banks first
  const arr = Array(bankOffset)
    .fill(null)
    .map(() => ({ objects: [] }));
  banks.push(...arr);

  // Pack fixed areas
  if (filter !== 0) {
    for (const area of areas) {
      if (area[1].bank !== filter) {
        const sizeDiff: number = area[1].bank - banks.length;
        if (sizeDiff > 0) {
          // Add the extra banks first
          const arr = Array(sizeDiff)
            .fill(null)
            .map(() => ({ objects: [] }));
          banks.push(...arr);
        }
        banks[area[1].bank - 1].objects.push([...area]);
      }
    }
  }

  // Check fixed areas are within max size
  // for (const bank of banks) {
  for (let bankIndex = 0; bankIndex < banks.length; bankIndex++) {
    const bank = banks[bankIndex];
    const size = bank.objects.reduce((a, b) => a + b[1].size, 0);
    if (size > BANK_SIZE) {
      throw new Error(
        `Bank overflow in ${
          bankIndex + 1
        }. Size was ${size} bytes where max allowed is ${BANK_SIZE} bytes`
      );
    }
  }

  // Pack unfixed areas
  for (const area of areas) {
    if (filter === 0 || area[1].bank === filter) {
      let stored = false;

      // Find first fit in existing banks
      let bankNo = 0;
      for (const bank of banks) {
        bankNo += 1;

        // Skip until at bank_offset
        if (bankNo < bankOffset) {
          continue;
        }

        // Calculate current size of bank
        const res = bank.objects.reduce((a, b) => a + b[1].size, 0);

        // If can fit store it here
        if (res + area[1].size <= BANK_SIZE) {
          bank.objects.push([...area]);
          stored = true;
          break;
        }
      }
      // No room in existing banks, create a new bank
      if (!stored) {
        if (area[1].size > BANK_SIZE) {
          throw new Error(`Oversized ${area[1].size}`);
        }

        const newBank: Bank = { objects: [] };
        newBank.objects.push([...area]);
        banks.push(newBank);
      }
    }
  }

  // Convert packed data into object patch
  const patch = objects.map((x, i) => ({
    filename: x.filename,
    contents: x.contents,
    replacements: getBankReplacements(i, banks, mbc1),
  }));

  return patch;
};

export const getPatchMaxBank = (packed: ObjectPatch[]): number => {
  let max = 0;
  for (const patch of packed) {
    for (const replacement of patch.replacements) {
      if (replacement.to > max) {
        max = replacement.to;
      }
    }
  }
  return max;
};

/// Read an object file into a struct containing the information required
/// to pack the data into banks
export const toObjectData = (filename: string): Promise<ObjectData> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, contents) => {
      if (err) {
        return reject(err);
      }
      const banks = parseSizes(contents);
      return resolve({
        filename: filename,
        contents: contents,
        banks,
      });
    });
  });
};

export const writeAsync = (
  filename: string,
  contents: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, contents, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};

export const gbspack = async (
  inputFiles: string[],
  args: PackArgs
): Promise<PackResult> => {
  const bankOffset = args.bankOffset ?? 0;
  const outputPath = args.outputPath ?? "";
  const filter = args.filter ?? 0;
  const additional = args.additional ?? 0;
  const ext = args.extension ?? "o";
  const mbc1 = args.mbc1 ?? false;
  const verbose = args.verbose ?? false;

  if (verbose) {
    console.log(`Starting at bank=${bankOffset}`);
    console.log(`Processing ${inputFiles.length} files`);
    console.log(`Using extension .${ext}`);
    if (outputPath.length > 0) {
      console.log(`Output path=${outputPath}`);
    }
    if (mbc1) {
      console.log("Using MBC1 hardware");
    }
  }

  // Convert input files to ObjectData[]
  const objects: ObjectData[] = [];
  for (const filename of inputFiles) {
    if (verbose) {
      console.log(`Processing file: ${filename}`);
    }
    const object = await toObjectData(filename);
    objects.push(object);
  }

  // Pack object data into banks
  const packed = packObjectData(objects, filter, bankOffset, mbc1);

  const maxBankNo = getPatchMaxBank(packed) + additional;

  for (const patch of packed) {
    const outputFilename = toOutputFilename(patch.filename, outputPath, ext);
    if (verbose) {
      console.log(`Writing file ${outputFilename}`);
    }
    const newContents = replaceAllBanks(patch.contents, patch.replacements);
    if (verbose) {
      console.log(`Write ${outputFilename}`);
    }
    await writeAsync(outputFilename, newContents);
  }

  if (verbose) {
    console.log("Done");
  }

  return {
    cartSize: toCartSize(maxBankNo),
    maxBank: maxBankNo,
  };
};
