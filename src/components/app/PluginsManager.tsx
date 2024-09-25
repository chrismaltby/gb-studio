import React, { useCallback, useEffect, useMemo, useState } from "react";
import ThemeProvider from "ui/theme/ThemeProvider";
import GlobalStyle from "ui/globalStyle";
import { Button } from "ui/buttons/Button";
import { FlexGrow } from "ui/spacing/Spacing";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";
import type {
  PluginMetadata,
  PluginRepositoryMetadata,
} from "lib/pluginManager/types";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import { Input } from "ui/form/Input";
import styled from "styled-components";
import { Select } from "ui/form/Select";
import {
  PluginTypeSelect,
  OptionalPluginType,
} from "components/forms/PluginTypeSelect";
import { BlankIcon, CheckIcon, UpdateIcon } from "ui/icons/Icons";
import semverGt from "semver/functions/gt";
import { ConsistentWidthLabel } from "ui/util/ConsistentWidthLabel";

export type PluginItem = {
  id: string;
  name: string;
  plugin: PluginMetadata;
  repo: PluginRepositoryMetadata;
  installedVersion?: string;
  updateAvailable: boolean;
};

type PluginManagerAction = "none" | "install" | "remove";

const PluginsManager = () => {
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<PluginManagerAction>("none");
  const [pluginItems, setPluginItems] = useState<PluginItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [typeFilter, setTypeFilter] = useState<OptionalPluginType>("");

  const typeLabel: Record<OptionalPluginType, string> = useMemo(
    () => ({
      "": l10n("FIELD_ALL_TYPES"),
      assetPack: l10n("FIELD_ASSET_PACK"),
      eventsPlugin: l10n("FIELD_EVENTS_PLUGIN"),
      enginePlugin: l10n("FIELD_ENGINE_PLUGIN"),
      theme: l10n("MENU_THEME"),
    }),
    []
  );

  const refreshData = useCallback(async (force?: boolean) => {
    if (force) {
      setLoading(true);
      setPluginItems([]);
    }
    const repos = await API.pluginManager.getPluginsList(force);
    const installedPlugins = await API.pluginManager.getInstalledPlugins();
    const items: PluginItem[] = [];
    for (const repo of repos) {
      for (const plugin of repo.plugins) {
        const installedVersion = installedPlugins.find(
          (p) => p.path === plugin.filename.replace(/\.zip$/, ".json")
        )?.version;
        items.push({
          id: plugin.id,
          name: plugin.name,
          installedVersion,
          updateAvailable: installedVersion
            ? semverGt(plugin.version, installedVersion)
            : false,
          plugin,
          repo,
        });
      }
    }
    setLoading(false);
    setPluginItems(items);
  }, []);

  const refreshUsingCachedData = useCallback(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    window.addEventListener("focus", refreshUsingCachedData);
    return () => {
      window.removeEventListener("focus", refreshUsingCachedData);
    };
  });

  const filteredPluginItems = useMemo(() => {
    return pluginItems
      .filter((item) => {
        if (typeFilter && item.plugin.type !== typeFilter) {
          return false;
        }
        const searchKey =
          `@${item.id} ${item.name} ${item.repo.name}`.toLocaleUpperCase();
        const search = searchTerm.toLocaleUpperCase();
        return searchKey.includes(search);
      })
      .sort((a, b) => {
        const isCoreA = a.id.startsWith("core/");
        const isCoreB = b.id.startsWith("core/");
        if (isCoreA && !isCoreB) {
          return -1;
        } else if (!isCoreA && isCoreB) {
          return 1;
        } else {
          return a.id.localeCompare(b.id);
        }
      });
  }, [pluginItems, searchTerm, typeFilter]);

  const renderLabel = useCallback(
    (item: PluginItem) => {
      return (
        <StyledPluginItemRow>
          <StyledPluginItemRowName>
            {item.id}@{item.plugin.version}
          </StyledPluginItemRowName>
          <StyledPluginItemRowType title={typeLabel[item.plugin.type]}>
            {typeLabel[item.plugin.type]}
          </StyledPluginItemRowType>
          <StyledPluginItemRowRepo
            title={`${item.repo.name}\n${item.repo.url}`}
          >
            {item.repo.shortName ?? item.repo.name}
          </StyledPluginItemRowRepo>
        </StyledPluginItemRow>
      );
    },
    [typeLabel]
  );

  const height = 200;

  const selectedPluginItem = useMemo(() => {
    return pluginItems.find((item) => item.id === selectedId);
  }, [pluginItems, selectedId]);

  const installBtnLabel = l10n(
    selectedPluginItem?.updateAvailable
      ? "FIELD_UPDATE_PLUGIN"
      : selectedPluginItem?.installedVersion
      ? "FIELD_REINSTALL_PLUGIN"
      : "FIELD_ADD_TO_PROJECT"
  );

  return (
    <ThemeProvider>
      <GlobalStyle />
      <StyledPluginManagerWindow>
        <StyledPluginManagerListColumn>
          <StyledPluginManagerSearch>
            <Input
              type="search"
              placeholder={l10n("TOOLBAR_SEARCH")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />
            <PluginTypeSelect
              name="type"
              value={typeFilter}
              onChange={setTypeFilter}
            />
            <Select
              options={[
                {
                  label: l10n("FIELD_ALL_REPOSITORIES"),
                  value: "",
                },
                {
                  label: l10n("FIELD_REFRESH_REPOSITORIES"),
                  value: "refetch",
                },
              ]}
              value={{
                label: l10n("FIELD_ALL_REPOSITORIES"),
                value: "",
              }}
              onChange={(value) => {
                if (!value) {
                  return;
                }
                if (value.value === "refetch") {
                  refreshData(true);
                }
              }}
            />
          </StyledPluginManagerSearch>
          <StyledPluginManagerSearchResults>
            {filteredPluginItems.length > 0 ? (
              <FlatList
                selectedId={selectedId}
                items={filteredPluginItems}
                setSelectedId={setSelectedId}
                height={height}
                children={({ item }) => (
                  <EntityListItem
                    item={item}
                    type={"custom"}
                    icon={
                      item.installedVersion ? (
                        item.updateAvailable ? (
                          <UpdateIcon />
                        ) : (
                          <CheckIcon />
                        )
                      ) : (
                        <BlankIcon />
                      )
                    }
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
        <StyledPluginManagerDetailColumn>
          {selectedPluginItem ? (
            <>
              <StyledPluginManagerDetail>
                <h1>{selectedPluginItem.name}</h1>
                <h2>
                  {l10n("FIELD_VERSION")} {selectedPluginItem.plugin.version}
                </h2>
                <p>
                  {l10n("FIELD_AUTHOR")}: {selectedPluginItem.plugin.author}
                </p>
                <p>
                  <strong>
                    {l10n("FIELD_THIS_PACKAGE_IS_INSTALLED_FOR_YOUR_PROJECT")}
                  </strong>
                </p>
                {selectedPluginItem.plugin.url && (
                  <Button
                    variant="anchor"
                    onClick={() => {
                      if (selectedPluginItem.plugin.url) {
                        API.app.openExternal(selectedPluginItem.plugin.url);
                      }
                    }}
                  >
                    {l10n("FIELD_VIEW_DOCUMENTATION")}
                  </Button>
                )}
                {selectedPluginItem.plugin.description
                  .split("\n")
                  .map((line, lineNo) => (
                    <p key={lineNo}>{line}</p>
                  ))}

                <StyledPluginImageCarousel>
                  {selectedPluginItem.plugin.images?.map((url) => (
                    <img
                      key={url}
                      alt=""
                      src={`gbshttp://plugin-repo-asset/${selectedPluginItem.repo.id}/${selectedPluginItem.id}/${url}`}
                    />
                  ))}
                </StyledPluginImageCarousel>
              </StyledPluginManagerDetail>
              <StyledPluginManagerToolbar>
                {selectedPluginItem.plugin.gbsVersion &&
                selectedPluginItem.plugin.gbsVersion !== "*"
                  ? l10n("FIELD_REQUIRES_GBS_VERSION", {
                      version: selectedPluginItem.plugin.gbsVersion,
                    })
                  : ""}
                <FlexGrow />
                {selectedPluginItem.installedVersion && (
                  <Button
                    disabled={action !== "none"}
                    onClick={async () => {
                      if (action !== "none") {
                        return;
                      }
                      setAction("remove");
                      await API.pluginManager.removePlugin(
                        selectedPluginItem.id,
                        selectedPluginItem.repo.id
                      );
                      refreshData();
                      setAction("none");
                    }}
                  >
                    <ConsistentWidthLabel
                      label={
                        action === "remove"
                          ? l10n("FIELD_REMOVING")
                          : l10n("FIELD_REMOVE_PLUGIN")
                      }
                      possibleValues={[
                        l10n("FIELD_INSTALLING"),
                        l10n("FIELD_REMOVE_PLUGIN"),
                      ]}
                    />
                  </Button>
                )}
                <Button
                  disabled={action !== "none"}
                  onClick={async () => {
                    if (action !== "none") {
                      return;
                    }
                    setAction("install");
                    await API.pluginManager.addPlugin(
                      selectedPluginItem.id,
                      selectedPluginItem.repo.id
                    );
                    refreshData();
                    setAction("none");
                  }}
                >
                  <ConsistentWidthLabel
                    label={
                      action === "install"
                        ? l10n("FIELD_INSTALLING")
                        : installBtnLabel
                    }
                    possibleValues={[l10n("FIELD_INSTALLING"), installBtnLabel]}
                  />
                </Button>
              </StyledPluginManagerToolbar>
            </>
          ) : (
            <StyledPluginManagerNoSelectionView>
              {l10n(loading ? "FIELD_LOADING" : "FIELD_SELECT_A_PLUGIN")}
            </StyledPluginManagerNoSelectionView>
          )}
        </StyledPluginManagerDetailColumn>
      </StyledPluginManagerWindow>
    </ThemeProvider>
  );
};

const StyledPluginManagerWindow = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StyledPluginManagerListColumn = styled.div`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

const StyledPluginManagerSearch = styled.div`
  display: flex;
  padding: 5px;
  & > * {
    width: 20%;
  }
  & > :first-child {
    width: 60%;
  }
  & > *:not(:last-child) {
    margin-right: 5px;
  }
`;

const StyledPluginManagerSearchResults = styled.div`
  height: 200px;
`;

const StyledPluginManagerNoResults = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

const StyledPluginManagerDetailColumn = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${(props) => props.theme.colors.input.background};
`;

const StyledPluginManagerDetail = styled.div`
  user-select: text;
  flex-grow: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  h1 {
    margin-top: 0;
  }
  h2 {
    marigin-top: 0;
  }
  img {
    max-width: 100%;
  }
  overflow: auto;
`;

const StyledPluginManagerToolbar = styled.div`
  font-size: 11px;
  display: flex;
  min-height: 30px;
  padding: 10px;
  align-items: center;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  & > *:not(:last-child) {
    margin-right: 5px;
  }
`;

const StyledPluginManagerNoSelectionView = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const StyledPluginImageCarousel = styled.div`
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  img {
    height: 150px;
  }
  & > *:not(:last-child) {
    margin-right: 5px;
  }
`;

const StyledPluginItemRow = styled.div`
  display: flex;
`;

const StyledPluginItemRowName = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledPluginItemRowType = styled.div`
  width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledPluginItemRowRepo = styled.div`
  width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default PluginsManager;
