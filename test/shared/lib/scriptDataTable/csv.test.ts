import {
  csvToScriptDataTable,
  scriptDataTableToCSV,
} from "shared/lib/scriptDataTable/csv";

describe("scriptDataTableToCSV", () => {
  test("Should serialize labels, quoted values and constants", () => {
    expect(
      scriptDataTableToCSV(
        {
          label: 'Data "Table"',
          variables: [
            { type: "variable", value: "0" },
            { type: "variable", value: "1" },
          ],
          rows: [
            {
              label: "Row, 1",
              values: [
                { type: "number", value: 12 },
                { type: "constant", value: "constant-1" },
              ],
            },
          ],
        },
        [{ id: "constant-1", name: 'Score "Max"' }] as never,
        [
          { id: "0", name: "Score", type: "number" },
          { id: "1", name: "Lives", type: "number" },
        ],
      ),
    ).toEqual('"Data ""Table""",Score,Lives\n"Row, 1",12,"SCORE_""MAX"""');
  });

  test("Should escape row labels with quotes and newlines", () => {
    expect(
      scriptDataTableToCSV(
        {
          label: "Data Table",
          variables: [{ type: "variable", value: "0" }],
          rows: [
            {
              label: 'Row "1"\nNext Line',
              values: [{ type: "number", value: 12 }],
            },
          ],
        },
        [],
        [{ id: "0", name: "Score", type: "number" }],
      ),
    ).toEqual('Data Table,Score\n"Row ""1""\nNext Line",12');
  });

  test("Should serialize fixed array element columns", () => {
    expect(
      scriptDataTableToCSV(
        {
          variables: [
            {
              type: "variable",
              value: "array-1",
              index: { type: "number", value: 2 },
            },
          ],
          rows: [{ values: [{ type: "number", value: 12 }] }],
        },
        [],
        [{ id: "array-1", name: "MyArr", type: "array", size: 3 }],
      ),
    ).toEqual(",MyArr[2]\nRow 1,12");
  });

  test("Should provide variable id if named variable not found", () => {
    expect(
      scriptDataTableToCSV(
        {
          variables: [{ type: "variable", value: "missing-uuid" }],
          rows: [{ values: [{ type: "number", value: 12 }] }],
        },
        [],
        [],
      ),
    ).toEqual(`,missing-uuid\nRow 1,12`);
  });
});

describe("csvToScriptDataTable", () => {
  test("Should parse fixed array element columns", () => {
    expect(
      csvToScriptDataTable(
        ",MyArr[2]\nRow 1,12",
        [],
        [{ id: "array-1", name: "MyArr", type: "array", size: 3 }],
      ),
    ).toEqual({
      dataTable: {
        variables: [
          {
            type: "variable",
            value: "array-1",
            index: { type: "number", value: 2 },
          },
        ],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 12 }],
          },
        ],
      },
      newVariables: [],
    });
  });
  test("Should parse numbers, user constants and engine constants from CSV", () => {
    expect(
      csvToScriptDataTable(
        'Data Table,V0,Score\n"Row 1",7,PLAYER_MAX_HP\nRow 2,engine::MAX_VOLUME,unknown',
        [{ id: "constant-1", name: "PLAYER_MAX_HP" }] as never,
        [
          { id: "V0", name: "V0", type: "number" },
          { id: "1", name: "Score", type: "number" },
        ],
      ),
    ).toEqual({
      dataTable: {
        label: "Data Table",
        variables: [
          { type: "variable", value: "V0" },
          { type: "variable", value: "1" },
        ],
        rows: [
          {
            label: "Row 1",
            values: [
              { type: "number", value: 7 },
              { type: "constant", value: "constant-1" },
            ],
          },
          {
            label: "Row 2",
            values: [
              { type: "constant", value: "engine::MAX_VOLUME" },
              { type: "number", value: 0 },
            ],
          },
        ],
      },
      newVariables: [],
    });
  });

  test("Should prioritise special variable codes over matching global names", () => {
    expect(
      csvToScriptDataTable(
        "Data Table,L0\nRow 1,1",
        [],
        [
          { id: "L0", name: "L0", type: "number" },
          { id: "global-1", name: "L0", type: "number" },
        ],
      ).dataTable.variables,
    ).toEqual([{ type: "variable", value: "L0" }]);
  });

  test("Should reject an array column matched to a scalar variable", () => {
    expect(() =>
      csvToScriptDataTable(
        "Data Table,Score[0]\nRow 1,1",
        [],
        [{ id: "score", name: "Score", type: "number" }],
      ),
    ).toThrow("ERROR_DATA_TABLE_CSV_VARIABLE_TYPE");
  });

  test("Should reject an out of range array index", () => {
    expect(() =>
      csvToScriptDataTable(
        "Data Table,MyArr[3]\nRow 1,1",
        [],
        [{ id: "array-1", name: "MyArr", type: "array", size: 3 }],
      ),
    ).toThrow("ERROR_DATA_TABLE_CSV_ARRAY_INDEX");
  });

  test("Should describe missing scalar and correctly sized array variables", () => {
    expect(
      csvToScriptDataTable(
        "Data Table,Score,MyArr[0],MyArr[4]\nRow 1,1,2,3",
        [],
        [],
      ),
    ).toMatchObject({
      dataTable: {
        variables: [
          { type: "variable", value: "__new_variable_0" },
          {
            type: "variable",
            value: "__new_variable_1",
            index: { type: "number", value: 0 },
          },
          {
            type: "variable",
            value: "__new_variable_1",
            index: { type: "number", value: 4 },
          },
        ],
      },
      newVariables: [
        {
          placeholder: "__new_variable_0",
          name: "Score",
          type: "number",
        },
        {
          placeholder: "__new_variable_1",
          name: "MyArr",
          type: "array",
          size: 5,
        },
      ],
    });
  });

  test("Should pad jagged rows with zeros based on header variables", () => {
    expect(
      csvToScriptDataTable(
        "my data table,L0,L1,T0,L4\nfoo,2\nbar\nhello,3,4",
        [],
        ["L0", "L1", "T0", "L4"].map((id) => ({
          id,
          name: id,
          type: "number" as const,
        })),
      ),
    ).toEqual({
      dataTable: {
        label: "my data table",
        variables: [
          { type: "variable", value: "L0" },
          { type: "variable", value: "L1" },
          { type: "variable", value: "T0" },
          { type: "variable", value: "L4" },
        ],
        rows: [
          {
            label: "foo",
            values: [
              { type: "number", value: 2 },
              { type: "number", value: 0 },
              { type: "number", value: 0 },
              { type: "number", value: 0 },
            ],
          },
          {
            label: "bar",
            values: [
              { type: "number", value: 0 },
              { type: "number", value: 0 },
              { type: "number", value: 0 },
              { type: "number", value: 0 },
            ],
          },
          {
            label: "hello",
            values: [
              { type: "number", value: 3 },
              { type: "number", value: 4 },
              { type: "number", value: 0 },
              { type: "number", value: 0 },
            ],
          },
        ],
      },
      newVariables: [],
    });
  });

  test("Should discard values beyond the header variable count", () => {
    expect(
      csvToScriptDataTable(
        "Data Table,V0,V1\nRow 1,1,2,3,4",
        [],
        ["V0", "V1"].map((id) => ({
          id,
          name: id,
          type: "number" as const,
        })),
      ),
    ).toEqual({
      dataTable: {
        label: "Data Table",
        variables: [
          { type: "variable", value: "V0" },
          { type: "variable", value: "V1" },
        ],
        rows: [
          {
            label: "Row 1",
            values: [
              { type: "number", value: 1 },
              { type: "number", value: 2 },
            ],
          },
        ],
      },
      newVariables: [],
    });
  });

  test("Should throw when imported CSV contains no variables", () => {
    expect(() => csvToScriptDataTable("Data Table", [], [])).toThrow(
      "ERROR_DATA_TABLE_CSV_NO_VARIABLES",
    );
  });

  test("Should throw when imported CSV contains no rows", () => {
    expect(() => csvToScriptDataTable("Data Table,Score\n", [], [])).toThrow(
      "ERROR_DATA_TABLE_CSV_NO_ROW_DATA",
    );
  });
});
