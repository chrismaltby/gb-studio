import { Dictionary } from "@reduxjs/toolkit";
import {
  EngineFieldCType,
  EngineFieldSchema,
} from "../../store/features/engine/engineState";

interface PrecompiledEngineField {
  offset: number;
  field: EngineFieldSchema;
}

export const precompileEngineFields = (
  engineFields: EngineFieldSchema[]
): Dictionary<PrecompiledEngineField> => {
  let offset = 0;
  const offsets: Dictionary<PrecompiledEngineField> = {};
  for (let engineField of engineFields) {
    offsets[engineField.key] = {
      offset,
      field: engineField,
    };
    if (is16BitCType(engineField.cType)) {
      offset += 2;
    } else {
      offset += 1;
    }
  }
  return offsets;
};

export const is16BitCType = (cType: EngineFieldCType): boolean => {
  return cType === "WORD" || cType === "UWORD";
};

export const minForCType = (cType: EngineFieldCType): number => {
  if (cType === "WORD") {
    return -32768;
  }
  if (cType === "BYTE") {
    return -128;
  }
  return 0;
};

export const maxForCType = (cType: EngineFieldCType): number => {
  if (cType === "UWORD") {
    return 65535;
  }
  if (cType === "WORD") {
    return 32767;
  }
  if (cType === "BYTE") {
    return 127;
  }
  return 255;
};

export const clampToCType = (
  value: number,
  cType: EngineFieldCType
): number => {
  const min = minForCType(cType);
  const max = maxForCType(cType);
  return Math.max(min, Math.min(max, value));
};
