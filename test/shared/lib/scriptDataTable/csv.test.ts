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
          variables: ["0", "1"],
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
      ),
    ).toEqual('"Data ""Table""",0,1\n"Row, 1",12,"SCORE_""MAX"""');
  });

  test("Should escape row labels with quotes and newlines", () => {
    expect(
      scriptDataTableToCSV(
        {
          label: "Data Table",
          variables: ["0"],
          rows: [
            {
              label: 'Row "1"\nNext Line',
              values: [{ type: "number", value: 12 }],
            },
          ],
        },
        [],
      ),
    ).toEqual('Data Table,0\n"Row ""1""\nNext Line",12');
  });
});

describe("csvToScriptDataTable", () => {
  test("Should parse numbers, user constants and engine constants from CSV", () => {
    expect(
      csvToScriptDataTable(
        'Data Table,V0,1\n"Row 1",7,PLAYER_MAX_HP\nRow 2,engine::MAX_VOLUME,unknown',
        [{ id: "constant-1", name: "PLAYER_MAX_HP" }] as never,
      ),
    ).toEqual({
      label: "Data Table",
      variables: ["V0", "1"],
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
    });
  });

  test("Should pad jagged rows with zeros based on header variables", () => {
    expect(
      csvToScriptDataTable("my data table,L0,L1,T0,L4\nfoo,2\nbar\nhello,3,4", []),
    ).toEqual({
      label: "my data table",
      variables: ["L0", "L1", "T0", "L4"],
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
    });
  });

  test("Should discard values beyond the header variable count", () => {
    expect(csvToScriptDataTable("Data Table,V0,V1\nRow 1,1,2,3,4", [])).toEqual({
      label: "Data Table",
      variables: ["V0", "V1"],
      rows: [
        {
          label: "Row 1",
          values: [
            { type: "number", value: 1 },
            { type: "number", value: 2 },
          ],
        },
      ],
    });
  });

  test("Should throw when imported CSV contains no variables", () => {
    expect(() => csvToScriptDataTable("Data Table", [])).toThrow(
      "ERROR_DATA_TABLE_CSV_NO_VARIABLES",
    );
  });

  test("Should throw when imported CSV contains no rows", () => {
    expect(() => csvToScriptDataTable("Data Table,0\n", [])).toThrow(
      "ERROR_DATA_TABLE_CSV_NO_ROW_DATA",
    );
  });
});
