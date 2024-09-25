import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "ui/buttons/Button";
import { FlexGrow } from "ui/spacing/Spacing";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";
import type {
  PluginMetadata,
  PluginRepositoryEntry,
  PluginRepositoryMetadata,
} from "lib/pluginManager/types";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import { Input } from "ui/form/Input";
import {
  StyledPluginItemRow,
  StyledPluginManagerWindow,
  StyledPluginManagerListColumn,
  StyledPluginManagerSearch,
  StyledPluginManagerSearchResults,
  StyledPluginManagerNoResults,
  StyledPluginManagerRepoForm,
  StyledPluginManagerRepoBtns,
  StyledPluginItemRowRepoName,
  StyledPluginItemRowRepoBtns,
  StyledPluginItemRowRepoUrl,
} from "./style";
import { TextField } from "ui/form/TextField";
import useResizeObserver from "ui/hooks/use-resize-observer";
import { CloseIcon } from "ui/icons/Icons";

export type RepoItem = {
  id: string;
  name: string;
  plugin: PluginMetadata;
  repo: PluginRepositoryMetadata;
  installedVersion?: string;
  updateAvailable: boolean;
};

const protectedIds = ["core"];

type PluginManagerRepoAction = "none" | "add" | "remove";

interface PluginsManagerReposProps {
  onClose: () => void;
}

const PluginsManagerRepos = ({ onClose }: PluginsManagerReposProps) => {
  const [listRef, listSize] = useResizeObserver<HTMLDivElement>();
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<PluginManagerRepoAction>("none");
  const [repoItems, setRepoItems] = useState<PluginRepositoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const refreshData = useCallback(async () => {
    const reposList = await API.pluginManager.getPluginRepos();
    setRepoItems(reposList);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filteredRepoItems = useMemo(() => {
    return repoItems
      .filter((item) => {
        const searchKey = `${item.url} ${item.name}`.toLocaleUpperCase();
        const search = searchTerm.toLocaleUpperCase();
        return searchKey.includes(search);
      })
      .sort((a, b) => {
        const isCoreA = a.id.startsWith("GB Studio");
        const isCoreB = b.id.startsWith("GB Studio");
        if (isCoreA && !isCoreB) {
          return -1;
        } else if (!isCoreA && isCoreB) {
          return 1;
        } else {
          return a.id.localeCompare(b.id);
        }
      });
  }, [repoItems, searchTerm]);

  const renderLabel = useCallback((item: PluginRepositoryEntry) => {
    return (
      <StyledPluginItemRow>
        <StyledPluginItemRowRepoName>{item.name}</StyledPluginItemRowRepoName>
        <StyledPluginItemRowRepoUrl>{item.url}</StyledPluginItemRowRepoUrl>
        <StyledPluginItemRowRepoBtns>
          {!protectedIds.includes(item.id) && (
            <Button size="small" title={l10n("FIELD_DELETE_REPOSITORY")}>
              <CloseIcon />
            </Button>
          )}
        </StyledPluginItemRowRepoBtns>
      </StyledPluginItemRow>
    );
  }, []);

  const height = listSize.height ?? 200;

  useEffect(() => {
    window.resizeTo(window.innerWidth, 367 + 28);
  }, []);

  return (
    <StyledPluginManagerWindow>
      <StyledPluginManagerListColumn>
        <StyledPluginManagerSearch>
          <Input
            type="search"
            placeholder={l10n("TOOLBAR_SEARCH")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </StyledPluginManagerSearch>
        <StyledPluginManagerSearchResults ref={listRef}>
          {filteredRepoItems.length > 0 ? (
            <FlatList
              selectedId={selectedId}
              items={filteredRepoItems}
              setSelectedId={setSelectedId}
              height={height}
              children={({ item }) => (
                <EntityListItem
                  item={item}
                  type={"custom"}
                  renderLabel={renderLabel}
                />
              )}
            />
          ) : (
            <StyledPluginManagerNoResults>
              {l10n(loading ? "FIELD_LOADING" : "FIELD_NO_RESULTS")}
            </StyledPluginManagerNoResults>
          )}
        </StyledPluginManagerSearchResults>
      </StyledPluginManagerListColumn>
      <StyledPluginManagerRepoForm>
        <TextField
          name="url"
          label={l10n("FIELD_REPOSITORY_URL")}
          placeholder="https://www.example.com/repository.json"
        ></TextField>
        <StyledPluginManagerRepoBtns>
          <Button>{l10n("FIELD_ADD_REPOSITORY")}</Button>
          <FlexGrow />
          <Button onClick={onClose}>{l10n("FIELD_CLOSE")}</Button>
        </StyledPluginManagerRepoBtns>
      </StyledPluginManagerRepoForm>
    </StyledPluginManagerWindow>
  );
};

export default PluginsManagerRepos;
