import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Select } from "ui/form/Select";
import {
  PluginTypeSelect,
  OptionalPluginType,
} from "components/forms/PluginTypeSelect";
import { BlankIcon, CheckIcon, SettingsIcon, UpdateIcon } from "ui/icons/Icons";
import semverGt from "semver/functions/gt";
import { ConsistentWidthLabel } from "ui/util/ConsistentWidthLabel";
import { join } from "path";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";
import {
  StyledPluginItemRow,
  StyledPluginItemRowName,
  StyledPluginItemRowType,
  StyledPluginItemRowRepo,
  StyledPluginManagerWindow,
  StyledPluginManagerListColumn,
  StyledPluginManagerSearch,
  StyledPluginManagerSearchResults,
  StyledPluginManagerNoResults,
  StyledPluginManagerDetailColumn,
  StyledPluginManagerDetail,
  StyledPluginImageCarousel,
  StyledPluginManagerToolbar,
  StyledPluginManagerNoSelectionView,
} from "./style";

export type PluginItem = {
  id: string;
  name: string;
  plugin: PluginMetadata;
  repo: PluginRepositoryMetadata;
  installedVersion?: string;
  updateAvailable: boolean;
};

type PluginManagerAction = "none" | "install" | "remove";

interface PluginsManagerPluginsProps {
  onManageRepos: () => void;
}

const PluginsManagerPlugins = ({
  onManageRepos,
}: PluginsManagerPluginsProps) => {
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
          (p) => p.path === join(plugin.id, "plugin.json")
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

  useEffect(() => {
    window.resizeTo(window.innerWidth, 700);
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
            ]}
            value={{
              label: l10n("FIELD_ALL_REPOSITORIES"),
              value: "",
            }}
            onChange={(value) => {
              if (!value) {
                return;
              }
            }}
          />
          <DropdownButton label={<SettingsIcon />} showArrow={false}>
            <MenuItem onClick={onManageRepos}>
              {l10n("FIELD_MANAGE_REPOSITORIES")}
            </MenuItem>
            <MenuItem onClick={() => refreshData(true)}>
              {l10n("FIELD_REFRESH_REPOSITORIES")}
            </MenuItem>
          </DropdownButton>
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
  );
};

export default PluginsManagerPlugins;
