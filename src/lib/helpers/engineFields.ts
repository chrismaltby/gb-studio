import { Dictionary } from "@reduxjs/toolkit";
import { off } from "electron-settings";
import {
  EnginePropCType,
  EnginePropSchemaField,
} from "../../store/features/engine/engineState";

interface PrecompiledEngineField {
  offset: number;
  field: EnginePropSchemaField;
}

export const precompileEngineFields = (
  engineFields: EnginePropSchemaField[]
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

export const is16BitCType = (cType: EnginePropCType): boolean => {
  return cType === "WORD" || cType === "UWORD";
};
