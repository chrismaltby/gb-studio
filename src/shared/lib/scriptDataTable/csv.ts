import { constantName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { Constant } from "shared/lib/resources/types";
import {
  isScriptDataTable,
  ScriptDataTable,
} from "shared/lib/scriptDataTable/types";

const escapeCSVValue = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const isEngineConstantSymbol = (value: string) => {
  return value.startsWith("engine::");
};

const parseCSVCellValue = (
  value: string | undefined,
  reverseConstantsLookup: Record<string, string>,
) => {
  const trimmedValue = (value ?? "").trim();
  const numValue = Number(trimmedValue);
  if (!isNaN(numValue)) {
    return { type: "number" as const, value: numValue };
  }
  if (isEngineConstantSymbol(trimmedValue)) {
    return { type: "constant" as const, value: trimmedValue };
  }
  const constantId = reverseConstantsLookup[trimmedValue];
  if (constantId) {
    return { type: "constant" as const, value: constantId };
  }
  return { type: "number" as const, value: 0 };
};

const parseCSV = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  row.push(value);
  rows.push(row);

  return rows.filter((row) => row.length > 1 || row[0].trim().length > 0);
};

export const scriptDataTableToCSV = (
  data: ScriptDataTable,
  constants: Constant[],
): string => {
  const constantsLookup = Object.fromEntries(
    constants.map((constant, constantIndex) => [
      constant.id,
      constantName(constant, constantIndex),
    ]),
  );
  const header = [data.label ?? "", ...data.variables]
    .map(escapeCSVValue)
    .join(",");
  const rows = data.rows.map((row, index) => {
    const label = row.label ?? `Row ${index + 1}`;
    const values = row.values.map((value) => {
      if (value === undefined) return "";
      if (value.type === "constant") {
        const constant = constantsLookup[value.value];
        if (constant) {
          return escapeCSVValue(constant);
        }
        return escapeCSVValue(value.value);
      }
      return value.value.toString();
    });
    return [escapeCSVValue(label), ...values].join(",");
  });
  return [header, ...rows].join("\n");
};

export const csvToScriptDataTable = (
  csv: string,
  constants: Constant[],
): ScriptDataTable | undefined => {
  const reverseConstantsLookup = Object.fromEntries(
    constants.map((constant, constantIndex) => [
      constantName(constant, constantIndex),
      constant.id,
    ]),
  );

  const csvRows = parseCSV(csv);
  if (csvRows.length === 0) {
    throw new Error(l10n("ERROR_DATA_TABLE_CSV_NO_ROW_DATA"));
  }

  const [header, ...rows] = csvRows;
  const variables = header.slice(1).map((v) => v.trim());

  const dataRows = rows.map(([label = "", ...values]) => {
    return {
      label: label.trim(),
      values: variables.map((_, index) =>
        parseCSVCellValue(values[index], reverseConstantsLookup),
      ),
    };
  });
  const dataTable: ScriptDataTable = {
    label: header[0].trim() || undefined,
    variables,
    rows: dataRows,
  };

  if (!isScriptDataTable(dataTable)) {
    throw new Error(l10n("ERROR_DATA_TABLE_CSV_INVALID"));
  }

  if (dataTable.variables.length === 0) {
    throw new Error(l10n("ERROR_DATA_TABLE_CSV_NO_VARIABLES"));
  }

  if (dataTable.rows.length === 0) {
    throw new Error(l10n("ERROR_DATA_TABLE_CSV_NO_ROW_DATA"));
  }

  return dataTable;
};
