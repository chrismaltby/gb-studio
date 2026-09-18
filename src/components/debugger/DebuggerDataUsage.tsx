import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import type {
  BuildUsageSource,
  BuildUsageScript,
} from "lib/compiler/buildUsage";
import {
  buildUsageAssetSourceTypeLabel,
  buildUsageItems,
  buildUsageItemTypeLabel,
  type BuildUsageItem,
} from "shared/lib/compiler/buildUsageItems";
import { ROM_BANK_SIZE } from "shared/lib/compiler/memoryLayout";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import editorActions from "store/features/editor/editorActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import type {
  DataUsageFilter,
  DataUsageSortKey,
} from "store/features/debugger/debuggerState";
import {
  actorSelectors,
  backgroundSelectors,
  customEventSelectors,
  musicSelectors,
  sceneSelectors,
  soundSelectors,
  spriteSheetSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesSelectors";
import { DebuggerUsageCard } from "ui/debugger/DebuggerUsageCard";
import { SearchInput } from "ui/form/SearchInput";
import { Button } from "ui/buttons/Button";
import { CaretDownIcon, CaretUpIcon } from "ui/icons/Icons";
import { TooltipWrapper } from "ui/tooltips/Tooltip";
import { LinkButton } from "ui/debugger/LinkButton";
import { DebuggerBankUsage } from "ui/debugger/DebuggerBankUsage";

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToolbarSearch = styled(SearchInput)`
  font-size: 11px;
`;

const FilterButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const UsageTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  th,
  td {
    padding: 5px 8px;
    border-bottom: 1px solid ${(p) => p.theme.colors.card.divider};
    text-align: left;
    text-overflow: ellipsis;
    overflow: hidden;
    vertical-align: middle;
  }
  td:first-child {
    width: 200px;
  }
  th:last-child,
  td:last-child {
    width: 200px;
    text-align: right;
  }
  tbody tr:hover {
    background: ${(p) => p.theme.colors.list.activeBackground};
  }
`;

const SortButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  svg {
    width: 8px;
    height: 8px;
    fill: currentColor;
  }
`;

const ScriptSource = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ScriptSourceSummary = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
`;

const UsageBarTrack = styled.div`
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: ${(p) => p.theme.colors.input.border};
  overflow: hidden;
`;

const UsageBarFill = styled.div<{ $percent: number; $color: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${(p) => p.$percent}%;
  background: ${(p) => p.$color};
`;

export const usageBarColor = (size: number) =>
  size < 8 * 1024 ? "#3dad3d" : size < 12 * 1024 ? "orange" : "#e20e2b";

export const usageBarPercent = (size: number) =>
  Math.min(100, (size / ROM_BANK_SIZE) * 100);

const UsageBar = ({ size }: { size: number }) => (
  <UsageBarTrack>
    <UsageBarFill
      $percent={usageBarPercent(size)}
      $color={usageBarColor(size)}
    />
  </UsageBarTrack>
);

const FILTERS: DataUsageFilter[] = [
  "all",
  "script",
  "scene",
  "sprite",
  "background",
  "music",
  "sound",
];

const filterLabel = (filter: DataUsageFilter) =>
  filter === "all" ? l10n("FIELD_ALL") : buildUsageItemTypeLabel(filter);

const rowMatchesSearch = (row: BuildUsageItem, search: string) =>
  row.name.toLowerCase().includes(search) ||
  row.symbol.toLowerCase().includes(search) ||
  row.sourceFile.toLowerCase().includes(search);

const DebuggerDataUsage = ({
  scripts,
  sources,
}: {
  scripts: BuildUsageScript[];
  sources: BuildUsageSource[];
}) => {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector(sceneSelectors.selectAll);
  const actors = useAppSelector(actorSelectors.selectAll);
  const triggers = useAppSelector(triggerSelectors.selectAll);
  const customEvents = useAppSelector(customEventSelectors.selectAll);
  const sprites = useAppSelector(spriteSheetSelectors.selectAll);
  const backgrounds = useAppSelector(backgroundSelectors.selectAll);
  const music = useAppSelector(musicSelectors.selectAll);
  const sounds = useAppSelector(soundSelectors.selectAll);
  const searchTerm = useAppSelector((state) => state.debug.dataUsageSearchTerm);
  const filter = useAppSelector((state) => state.debug.dataUsageFilter);
  const sortKey = useAppSelector((state) => state.debug.dataUsageSortKey);
  const sortAsc = useAppSelector((state) => state.debug.dataUsageSortAsc);
  const [expandedScriptRows, setExpandedScriptRows] = useState<Set<string>>(
    () => new Set(),
  );

  const onSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      dispatch(
        debuggerActions.setDataUsageSearchTerm(event.currentTarget.value),
      ),
    [dispatch],
  );

  const onSort = useCallback(
    (key: DataUsageSortKey) => {
      if (key === sortKey)
        dispatch(debuggerActions.setDataUsageSortAsc(!sortAsc));
      else {
        dispatch(debuggerActions.setDataUsageSortKey(key));
        dispatch(debuggerActions.setDataUsageSortAsc(key !== "size"));
      }
    },
    [dispatch, sortAsc, sortKey],
  );

  const rows = useMemo(
    () =>
      buildUsageItems({
        scripts,
        sources,
        entities: {
          scenes,
          actors,
          triggers,
          customEvents,
          sprites,
          backgrounds,
          music,
          sounds,
        },
      }),
    [
      scripts,
      sources,
      scenes,
      actors,
      triggers,
      customEvents,
      sprites,
      backgrounds,
      music,
      sounds,
    ],
  );

  const search = searchTerm.trim().toLowerCase();

  const filteredSortedRows = useMemo(() => {
    const sorted = rows
      .filter(
        (row) =>
          (filter === "all" || row.type === filter) &&
          (!search || rowMatchesSearch(row, search)),
      )
      .sort((left, right) =>
        sortKey === "size"
          ? left.size - right.size
          : sortKey === "type"
            ? buildUsageItemTypeLabel(left.type).localeCompare(
                buildUsageItemTypeLabel(right.type),
              )
            : sortKey === "filename"
              ? left.sourceFile.localeCompare(right.sourceFile)
              : left.name.localeCompare(right.name),
      );
    return sortAsc ? sorted : sorted.reverse();
  }, [filter, rows, search, sortAsc, sortKey]);

  if (!rows.length) {
    return null;
  }

  return (
    <DebuggerUsageCard
      title={l10n("FIELD_PROJECT_DATA")}
      toolbar={
        <Toolbar>
          <FilterButtons>
            {FILTERS.map((option) => (
              <Button
                key={option}
                size="small"
                variant={filter === option ? "underlined" : "transparent"}
                onClick={() =>
                  dispatch(debuggerActions.setDataUsageFilter(option))
                }
              >
                {filterLabel(option)}
              </Button>
            ))}
          </FilterButtons>
          <ToolbarSearch
            value={searchTerm}
            placeholder={l10n("TOOLBAR_SEARCH")}
            onChange={onSearch}
          />
        </Toolbar>
      }
    >
      <UsageTable>
        <thead>
          <tr>
            {(
              [
                ["name", l10n("FIELD_NAME")],
                ["filename", l10n("FIELD_FILENAME")],
                ["type", l10n("FIELD_TYPE")],
                ["size", l10n("FIELD_SIZE")],
              ] as [DataUsageSortKey, string][]
            ).map(([key, label]) => (
              <th key={key} colSpan={key === "size" ? 2 : undefined}>
                <SortButton onClick={() => onSort(key)}>
                  {label}
                  {sortKey === key &&
                    (sortAsc ? <CaretUpIcon /> : <CaretDownIcon />)}
                </SortButton>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredSortedRows.map((row) => {
            const expanded =
              expandedScriptRows.has(row.key) ||
              Boolean(search && rowMatchesSearch(row, search));
            return (
              <tr key={row.key}>
                <td>
                  {row.type === "script" ? (
                    <ScriptSource>
                      <ScriptSourceSummary>
                        <LinkButton
                          onClick={() =>
                            dispatch(
                              editorActions.openEditorScript(row.sources[0]),
                            )
                          }
                        >
                          {row.sourceLabels[0]}
                        </LinkButton>
                        {!expanded && row.sources.length > 1 && (
                          <TooltipWrapper
                            tooltip={l10n("FIELD_SCRIPT_SHARED_BY", {
                              sources: row.sourceLabels.join(", "),
                            })}
                          >
                            <LinkButton
                              aria-expanded={false}
                              onClick={() =>
                                setExpandedScriptRows((current) =>
                                  new Set(current).add(row.key),
                                )
                              }
                            >
                              {l10n("FIELD_N_MORE", {
                                n: row.sources.length - 1,
                              })}
                            </LinkButton>
                          </TooltipWrapper>
                        )}
                      </ScriptSourceSummary>
                      {expanded &&
                        row.sources.slice(1).map((source, index) => (
                          <LinkButton
                            key={`${source.entityType}:${source.entityId}:${source.scriptKey}:${index + 1}`}
                            onClick={() =>
                              dispatch(editorActions.openEditorScript(source))
                            }
                          >
                            {row.sourceLabels[index + 1]}
                          </LinkButton>
                        ))}
                    </ScriptSource>
                  ) : (
                    <LinkButton
                      onClick={() =>
                        dispatch(
                          editorActions.openEditorResourceBySymbol({
                            type: row.type,
                            symbol: row.symbol,
                          }),
                        )
                      }
                    >
                      {row.name}
                      {buildUsageAssetSourceTypeLabel(row.sourceType)
                        ? ` (${buildUsageAssetSourceTypeLabel(row.sourceType)})`
                        : ""}
                    </LinkButton>
                  )}
                </td>
                <td>{row.sourceFile}</td>
                <td>{buildUsageItemTypeLabel(row.type)}</td>
                <td>
                  <UsageBar size={row.size} />
                </td>
                <td>
                  <DebuggerBankUsage size={row.size} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </UsageTable>
    </DebuggerUsageCard>
  );
};

export default DebuggerDataUsage;
