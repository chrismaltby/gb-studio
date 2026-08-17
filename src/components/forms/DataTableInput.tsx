import { ConstantSelectWrapper } from "components/forms/ConstantSelect";
import ConstantValueSelect from "components/forms/ConstantValueSelect";
import { VariableSelectWrapper } from "components/forms/VariableSelect";
import { VariableElementSelect } from "components/forms/VariableElementSelect";
import { useVariableFieldContext } from "components/script/fields/useVariableFieldContext";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";
import { DataTableCSVVariable } from "shared/lib/scriptDataTable/csv";
import {
  ScriptDataTable,
  ScriptDataTableRow,
} from "shared/lib/scriptDataTable/types";
import {
  ConstScriptValue,
  ScriptVariableElement,
} from "shared/lib/scriptValue/types";
import type { Variable } from "shared/lib/resources/types";
import { constantSelectors } from "store/features/entities/entitiesSelectors";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppStore } from "store/hooks";
import styled from "styled-components";
import { Alert } from "ui/alerts/Alert";
import { Button } from "ui/buttons/Button";
import { PillButton } from "ui/buttons/PillButton";
import { Input } from "ui/form/Input";
import { InputGroup, InputGroupPrepend } from "ui/form/InputGroup";
import { StyledInput } from "ui/form/style";
import { CloseIcon, DotsIcon, MagnifyIcon } from "ui/icons/Icons";
import { Portal } from "ui/layout/Portal";
import { MenuOverlay } from "ui/menu/Menu";
import { FlexGrow } from "ui/spacing/Spacing";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
`;

const ScrollWrapper = styled.div`
  width: 100%;
  align-self: flex-start;
  background: ${(props) => props.theme.colors.input.background};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  overflow: auto;
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  table tr td {
    background: ${(props) => props.theme.colors.input.background};
    padding: 4px 2px;
    border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
    border-right: 1px solid ${(props) => props.theme.colors.input.border};
  }

  table tbody tr td:first-child,
  table thead tr th:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    text-align: center;
    border-right: 1px solid ${(props) => props.theme.colors.input.border};
    width: 30px;
  }

  table tr th,
  table thead tr th:first-child {
    background: ${(props) => props.theme.colors.scripting.header.background};
    padding: 4px 2px;
    border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
    border-right: 1px solid ${(props) => props.theme.colors.input.border};
  }

  table tbody tr td:first-child {
    padding: 0px 11px;
  }

  table thead tr th {
    font-weight: normal;
    text-align: left;
  }

  table tr:last-child td {
    border-bottom: none;
  }

  table tbody tr td:last-child,
  table thead tr th:last-child {
    border-right: none;
  }

  table thead tr th:last-child {
    width: 29px;
  }

  ${VariableSelectWrapper} {
    min-width: 110px;
  }

  ${ConstantSelectWrapper} {
    min-width: 110px;
  }

  ${StyledInput} {
    min-width: 90px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`;

const AddRowButton = styled(Button)`
  max-width: 32px;
`;

const ZoomButton = styled(Button)`
  max-width: 32px;
`;

const ExpandTableButton = styled.div`
  position: sticky;
  width: 100%;
  display: flex;
  justify-content: center;
  left: 0;
  margin-top: 2px;
  padding: 4px;
  box-sizing: border-box;
  border-top: 1px solid ${(props) => props.theme.colors.input.border};
  > * {
    width: 50%;
    max-width: 100px;
  }
  svg {
    width: 12px;
    height: 12px;
  }
`;

const CSVAlert = styled.div`
  margin-top: 5px;
`;

const Footer = styled.div`
  svg {
    width: 12px;
    height: 12px;
  }
`;

const ZoomWrapper = styled.div`
  box-shadow: 0px 4px 500px 5000px rgba(0, 0, 0, 0.5);
  position: fixed;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  margin: 100px;
  background: ${(props) => props.theme.colors.sidebar.background};
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};

  border-radius: ${(props) => props.theme.borderRadius}px;
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  ${Wrapper} {
    height: 100%;
    min-height: 0;
  }

  ${ScrollWrapper} {
    flex-grow: 1;
    min-height: 0;
    width: 100%;
    overflow: auto;
    border-radius: 0;
    border: 0;
  }

  table thead tr th {
    position: sticky;
    top: 0px;
    z-index: 2;
  }

  table tbody tr td:nth-child(2),
  table thead tr th:nth-child(2) {
    position: sticky;
    left: 35px;
    text-align: center;
    border-right: 1px solid ${(props) => props.theme.colors.input.border};
  }

  table tbody tr td:first-child,
  table tbody tr td:nth-child(2) {
    z-index: 3;
  }

  table thead tr th:first-child,
  table thead tr th:nth-child(2) {
    z-index: 5;
  }

  ${Footer} {
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 10px;
    border-top: 1px solid ${(props) => props.theme.colors.input.border};
    background: ${(props) => props.theme.colors.background};
  }

  animation: zoomIn 0.2s ease;

  @keyframes zoomIn {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

export const CloseButton = styled.button`
  border: 0px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  position: fixed;
  top: 60px;
  right: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  background: ${(props) => props.theme.colors.input.background};
  border: 1px solid ${(props) => props.theme.colors.input.border};

  box-shadow: 0px 4px 80px rgba(0, 0, 0, 0.8);
  svg {
    width: 12px;
    height: 12px;
    fill: ${(props) => props.theme.colors.text};
  }
`;

interface DataTableInputProps {
  value: ScriptDataTable | undefined;
  onChange: (value: ScriptDataTable) => void;
  entityId: string;
  isNested?: boolean;
}

interface DataTableColumnHeaderProps {
  variable: ScriptVariableElement;
  colIndex: number;
  canRemoveColumn: boolean;
  entityId: string;
  onUpdateVariable: (colIndex: number, variable: ScriptVariableElement) => void;
  onRemoveColumn: (colIndex: number) => void;
}

interface DataTableRowProps {
  row: ScriptDataTableRow;
  rowIndex: number;
  columnCount: number;
  canRemoveRow: boolean;
  onUpdateRowLabel: (rowIndex: number, label: string) => void;
  onUpdateCellValue: (
    rowIndex: number,
    colIndex: number,
    value: ConstScriptValue | undefined,
  ) => void;
  onRemoveRow: (rowIndex: number) => void;
}

const defaultValue = (variableId: string): ScriptDataTable => ({
  variables: [{ type: "variable", value: variableId }],
  rows: [
    {
      label: "",
      values: [{ type: "number", value: 0 }],
    },
  ],
});

const nextColumnVariable = (
  variables: ScriptVariableElement[],
  availableVariableIds: string[],
  variablesLookup: Record<string, Variable | undefined>,
): ScriptVariableElement => {
  const previousVariable = variables.at(-1);
  if (previousVariable?.index?.type === "number") {
    const variable = variablesLookup[previousVariable.value];
    if (variable?.type === "array") {
      for (
        let index = previousVariable.index.value + 1;
        index < variable.size;
        index++
      ) {
        const alreadyUsed = variables.some(
          (candidate) =>
            candidate.value === previousVariable.value &&
            candidate.index?.type === "number" &&
            candidate.index.value === index,
        );
        if (!alreadyUsed) {
          return {
            type: "variable",
            value: previousVariable.value,
            index: { type: "number", value: index },
          };
        }
      }
    }
  }
  const variableId =
    availableVariableIds.find(
      (candidateId) =>
        !variables.some((variable) => variable.value === candidateId),
    ) ??
    availableVariableIds[0] ??
    "";
  return { type: "variable", value: variableId };
};

const ROW_CUT_OFF = 6;

export const portalRoot: HTMLElement = document.getElementById(
  "OverlayPortal",
) as HTMLElement;

const DataTableColumnHeader = React.memo(
  ({
    variable,
    colIndex,
    canRemoveColumn,
    entityId,
    onUpdateVariable,
    onRemoveColumn,
  }: DataTableColumnHeaderProps) => {
    return (
      <th>
        <InputGroup>
          {canRemoveColumn && (
            <InputGroupPrepend>
              <Button
                size="small"
                title={l10n("FIELD_REMOVE_COLUMN")}
                onClick={() => onRemoveColumn(colIndex)}
              >
                -
              </Button>
            </InputGroupPrepend>
          )}
          <VariableElementSelect
            value={variable}
            name={`variable_${colIndex}`}
            entityId={entityId}
            onChange={(newValue) => onUpdateVariable(colIndex, newValue)}
            allowRename
          />
        </InputGroup>
      </th>
    );
  },
);

const DataTableRow = React.memo(
  ({
    row,
    rowIndex,
    columnCount,
    canRemoveRow,
    onUpdateRowLabel,
    onUpdateCellValue,
    onRemoveRow,
  }: DataTableRowProps) => {
    return (
      <tr>
        <td>{rowIndex}</td>
        <td>
          <Input
            placeholder={l10n("FIELD_ROW_NAME")}
            value={row.label}
            onChange={(e) => onUpdateRowLabel(rowIndex, e.target.value)}
          />
        </td>
        {Array.from({ length: columnCount }, (_, colIndex) => (
          <td key={colIndex}>
            <ConstantValueSelect
              name={`value_${colIndex}_${rowIndex}`}
              value={row.values[colIndex]}
              onChange={(newValue) =>
                onUpdateCellValue(rowIndex, colIndex, newValue)
              }
            />
          </td>
        ))}
        <td>
          {canRemoveRow && (
            <Button
              title={l10n("FIELD_REMOVE_ROW")}
              onClick={() => onRemoveRow(rowIndex)}
            >
              -
            </Button>
          )}
        </td>
      </tr>
    );
  },
);

export const DataTableInput = ({
  value,
  onChange,
  entityId,
  isNested,
}: DataTableInputProps) => {
  const store = useAppStore();
  const {
    candidates: variableCandidates,
    variables: namedVariables,
    variablesLookup,
  } = useVariableFieldContext(entityId);
  const availableVariableIds = useMemo(
    () =>
      variableCandidates
        .filter(({ type }) => type === "number")
        .map(({ id }) => id),
    [variableCandidates],
  );
  const initialTable = useMemo(
    () => defaultValue(availableVariableIds[0] ?? ""),
    [availableVariableIds],
  );
  const csvVariables = useMemo<DataTableCSVVariable[]>(() => {
    const candidatesLookup = Object.fromEntries(
      variableCandidates.map((candidate) => [candidate.id, candidate]),
    );
    const variables = namedVariables.map((variable) => {
      const candidate = candidatesLookup[variable.id];
      const definition = variablesLookup[variable.id];
      return {
        id: variable.id,
        name: definition ? variable.name : variable.id,
        type: candidate?.type ?? "number",
        size: definition?.type === "array" ? definition.size : candidate?.size,
        isGlobal: Boolean(definition),
      };
    });
    return variables
      .sort((a, b) => Number(a.isGlobal) - Number(b.isGlobal))
      .map(({ isGlobal: _isGlobal, ...variable }) => variable);
  }, [namedVariables, variableCandidates, variablesLookup]);
  const [rowLimit, setRowLimit] = useState(!isNested);
  const [zoom, setZoom] = useState(false);
  const [csvError, setCSVError] = useState<string | null>(null);

  const table = value ?? initialTable;
  const maxRow = rowLimit ? ROW_CUT_OFF : table.rows.length;

  const tableRef = useRef(table);
  tableRef.current = table;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<"row" | "column" | null>(null);

  const updateTable = useCallback(
    (updater: (table: ScriptDataTable) => ScriptDataTable) => {
      const nextTable = updater(tableRef.current);
      tableRef.current = nextTable;
      onChangeRef.current(nextTable);
      setCSVError(null);
    },
    [],
  );

  const addColumn = useCallback(() => {
    pendingScrollRef.current = "column";

    updateTable((currentTable) => {
      const nextVariable = nextColumnVariable(
        currentTable.variables,
        availableVariableIds,
        variablesLookup,
      );
      return {
        ...currentTable,
        variables: [...currentTable.variables, nextVariable],
        rows: currentTable.rows.map((row) => ({
          ...row,
          values: [...row.values, { type: "number" as const, value: 0 }],
        })),
      };
    });
  }, [availableVariableIds, updateTable, variablesLookup]);

  const addRow = useCallback(() => {
    pendingScrollRef.current = "row";

    onChange({
      ...table,
      rows: [
        ...table.rows,
        {
          label: "",
          values: table.variables.map(() => ({
            type: "number" as const,
            value: 0,
          })),
        },
      ],
    });
    setCSVError(null);
    setRowLimit(false);
  }, [onChange, table]);

  const updateVariable = useCallback(
    (colIndex: number, newVariable: ScriptVariableElement) => {
      updateTable((currentTable) => ({
        ...currentTable,
        variables: currentTable.variables.map((variable, index) =>
          index === colIndex ? newVariable : variable,
        ),
      }));
    },
    [updateTable],
  );

  const removeColumn = useCallback(
    (colIndex: number) => {
      updateTable((currentTable) => ({
        ...currentTable,
        variables: currentTable.variables.filter(
          (_, index) => index !== colIndex,
        ),
        rows: currentTable.rows.map((row) => ({
          ...row,
          values: row.values.filter((_, index) => index !== colIndex),
        })),
      }));
    },
    [updateTable],
  );

  const updateRowLabel = useCallback(
    (rowIndex: number, label: string) => {
      updateTable((currentTable) => ({
        ...currentTable,
        rows: currentTable.rows.map((row, index) =>
          index === rowIndex ? { ...row, label } : row,
        ),
      }));
    },
    [updateTable],
  );

  const updateCellValue = useCallback(
    (
      rowIndex: number,
      colIndex: number,
      newValue: ConstScriptValue | undefined,
    ) => {
      updateTable((currentTable) => ({
        ...currentTable,
        rows: currentTable.rows.map((row, index) =>
          index === rowIndex
            ? {
                ...row,
                values: Array.from(
                  { length: currentTable.variables.length },
                  (_, valueIndex) =>
                    valueIndex === colIndex
                      ? newValue
                      : (row.values[valueIndex] ?? {
                          type: "number" as const,
                          value: 0,
                        }),
                ),
              }
            : row,
        ),
      }));
    },
    [updateTable],
  );

  const removeRow = useCallback(
    (rowIndex: number) => {
      updateTable((currentTable) => ({
        ...currentTable,
        rows: currentTable.rows.filter((_, index) => index !== rowIndex),
      }));
    },
    [updateTable],
  );

  useLayoutEffect(() => {
    const pendingScroll = pendingScrollRef.current;

    if (!pendingScroll || !scrollRef.current) {
      return;
    }

    pendingScrollRef.current = null;

    const scrollElement = scrollRef.current;

    if (pendingScroll === "column") {
      scrollElement.scrollTo({
        left: scrollElement.scrollWidth,
        behavior: "smooth",
      });
      return;
    }

    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: "smooth",
    });
  }, [table.variables.length, table.rows.length]);

  useEffect(() => {
    if (value === undefined) {
      onChange(initialTable);
    }
  }, [initialTable, onChange, value]);

  const importCSV = useCallback(async () => {
    const state = store.getState();
    const constants = constantSelectors.selectAll(state);
    try {
      const importedTable = await API.dataTable.importCSV(
        constants,
        csvVariables,
      );
      if (importedTable) {
        const { dataTable, newVariables } = importedTable;
        const newVariableIds: Record<string, string> = {};
        for (const variable of newVariables) {
          const action = entitiesActions.addVariable({
            name: variable.name,
            type: variable.type,
            ...(variable.type === "array" ? { size: variable.size } : {}),
          });
          const variableId = action.payload.variableId;
          store.dispatch(action);
          newVariableIds[variable.placeholder] = variableId;
        }
        onChange({
          ...dataTable,
          variables: dataTable.variables.map((variable) => ({
            ...variable,
            value: newVariableIds[variable.value] ?? variable.value,
          })),
        });
        setRowLimit(false);
      }
      setCSVError(null);
    } catch (e) {
      setCSVError((e as Error).message);
    }
  }, [csvVariables, onChange, store]);

  const exportCSV = useCallback(() => {
    const state = store.getState();
    const constants = constantSelectors.selectAll(state);
    try {
      API.dataTable.exportCSV(table, constants, csvVariables);
      setCSVError(null);
    } catch (e) {
      setCSVError((e as Error).message);
    }
  }, [csvVariables, table, store]);

  return (
    <Wrapper>
      <ScrollWrapper ref={scrollRef}>
        <table style={{ minWidth: table.variables.length * 140 + 120 + 80 }}>
          <thead>
            <tr>
              <th></th>
              <th>
                <Input
                  placeholder={l10n("FIELD_TABLE_NAME")}
                  value={table.label}
                  onChange={(e) =>
                    onChange({ ...table, label: e.target.value })
                  }
                />
              </th>
              {table.variables.map((variable, colIndex) => (
                <DataTableColumnHeader
                  key={colIndex}
                  variable={variable}
                  colIndex={colIndex}
                  canRemoveColumn={table.variables.length > 1}
                  entityId={entityId}
                  onUpdateVariable={updateVariable}
                  onRemoveColumn={removeColumn}
                />
              ))}
              <th>
                <Button onClick={addColumn} title={l10n("FIELD_ADD_COLUMN")}>
                  +
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(0, maxRow).map((row, rowIndex) => (
              <DataTableRow
                key={rowIndex}
                row={row}
                rowIndex={rowIndex}
                columnCount={table.variables.length}
                canRemoveRow={table.rows.length > 1}
                onUpdateRowLabel={updateRowLabel}
                onUpdateCellValue={updateCellValue}
                onRemoveRow={removeRow}
              />
            ))}
          </tbody>
        </table>
        {rowLimit && table.rows.length > maxRow && (
          <ExpandTableButton onClick={() => setRowLimit(false)}>
            <PillButton>
              <DotsIcon />
            </PillButton>
          </ExpandTableButton>
        )}
      </ScrollWrapper>
      <Footer>
        <ActionButtons>
          <AddRowButton onClick={addRow} title={l10n("FIELD_ADD_ROW")}>
            +
          </AddRowButton>
          <FlexGrow />
          {!isNested && (
            <ZoomButton
              onClick={(e) => {
                e.currentTarget.blur();
                setZoom(!zoom);
              }}
            >
              <MagnifyIcon />
            </ZoomButton>
          )}
          <Button onClick={importCSV}>{l10n("FIELD_IMPORT_CSV")}</Button>
          <Button onClick={exportCSV}>{l10n("FIELD_EXPORT_CSV")}</Button>
        </ActionButtons>
        {csvError && (
          <CSVAlert>
            <Alert variant="warning">{csvError}</Alert>
          </CSVAlert>
        )}
      </Footer>
      {zoom && (
        <Portal root={portalRoot}>
          <MenuOverlay onClick={() => setZoom(false)} />
          <CloseButton onClick={() => setZoom(false)}>
            <CloseIcon />
          </CloseButton>
          <ZoomWrapper>
            <DataTableInput
              value={table}
              onChange={onChange}
              entityId={entityId}
              isNested
            />
          </ZoomWrapper>
        </Portal>
      )}
    </Wrapper>
  );
};
