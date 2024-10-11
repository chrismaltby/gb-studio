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
import { Option, Select } from "ui/form/Select";
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
  StyledPillButtonWrapper,
} from "./style";
import {
  isGlobalPluginType,
  pluginDescriptionForType,
  pluginNameForType,
} from "shared/lib/plugins/pluginHelpers";
import { PillButton } from "ui/buttons/PillButton";
import { TooltipWrapper } from "ui/tooltips/Tooltip";

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
  const [reposOptions, setReposOptions] = useState<Option[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [typeFilter, setTypeFilter] = useState<OptionalPluginType>("");
  const [repoFilter, setRepoFilter] = useState<string>("");

  const typeLabel: Record<OptionalPluginType, string> = useMemo(
    () => ({
      "": l10n("FIELD_ALL_TYPES"),
      assetPack: l10n("FIELD_ASSET_PACK"),
      eventsPlugin: l10n("FIELD_EVENTS_PLUGIN"),
      enginePlugin: l10n("FIELD_ENGINE_PLUGIN"),
      theme: l10n("MENU_THEME"),
      lang: l10n("FIELD_LANGUAGE_PLUGIN"),
      template: l10n("FIELD_TEMPLATE_PLUGIN"),
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
          id: `${repo.id}-${plugin.id}`,
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
    const options: Option[] = [
      { value: "", label: l10n("FIELD_ALL_REPOSITORIES") },
    ].concat(
      repos.map((repo) => ({
        value: repo.id,
        label: repo.shortName || repo.name,
      }))
    );
    setLoading(false);
    setPluginItems(items);
    setReposOptions(options);
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
        if (repoFilter && item.repo.id !== repoFilter) {
          return false;
        }
        const searchKey =
          `${item.plugin.filename} ${item.name}`.toLocaleUpperCase();
        const search = searchTerm.toLocaleUpperCase();
        return searchKey.includes(search);
      })
      .sort((a, b) => {
        const isCoreRepoA = a.repo.id === "core";
        const isCoreRepoB = b.repo.id === "core";
        const isCorePluginA = a.plugin.id.startsWith("core/");
        const isCorePluginB = b.plugin.id.startsWith("core/");

        if (isCoreRepoA && !isCoreRepoB) {
          return -1;
        } else if (!isCoreRepoA && isCoreRepoB) {
          return 1;
        }

        if (isCorePluginA && !isCorePluginB) {
          return -1;
        } else if (!isCorePluginA && isCorePluginB) {
          return 1;
        }

        return a.id.localeCompare(b.id);
      });
  }, [pluginItems, repoFilter, searchTerm, typeFilter]);

  const selectedRepoOption = useMemo(
    () =>
      reposOptions.find((o) => o.value === repoFilter) ?? {
        value: "",
        label: l10n("FIELD_ALL_REPOSITORIES"),
      },
    [repoFilter, reposOptions]
  );

  const renderLabel = useCallback(
    (item: PluginItem) => {
      return (
        <StyledPluginItemRow>
          <StyledPluginItemRowName>
            {item.plugin.id}@{item.plugin.version}
          </StyledPluginItemRowName>
          <StyledPluginItemRowType title={typeLabel[item.plugin.type]}>
            {typeLabel[item.plugin.type]}
          </StyledPluginItemRowType>
          <StyledPluginItemRowRepo
            title={`${item.repo.name}\n${item.repo.url}`}
          >
            {item.repo.shortName || item.repo.name}
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
      : selectedPluginItem && isGlobalPluginType(selectedPluginItem.plugin.type)
      ? "FIELD_INSTALL_PLUGIN"
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
            options={reposOptions}
            value={selectedRepoOption}
            onChange={(value) => {
              if (!value) {
                return;
              }
              setRepoFilter(value.value);
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
              <StyledPillButtonWrapper>
                <TooltipWrapper
                  tooltip={l10n(
                    isGlobalPluginType(selectedPluginItem.plugin.type)
                      ? "FIELD_THIS_PACKAGE_IS_INSTALLED_GLOBALLY"
                      : "FIELD_THIS_PACKAGE_IS_INSTALLED_FOR_YOUR_PROJECT"
                  )}
                >
                  <PillButton>
                    {isGlobalPluginType(selectedPluginItem.plugin.type)
                      ? l10n("FIELD_GLOBAL")
                      : l10n("PROJECT")}
                  </PillButton>
                </TooltipWrapper>
                <TooltipWrapper
                  tooltip={pluginDescriptionForType(
                    selectedPluginItem.plugin.type
                  )}
                >
                  <PillButton>
                    {pluginNameForType(selectedPluginItem.plugin.type)}
                  </PillButton>
                </TooltipWrapper>
              </StyledPillButtonWrapper>
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
                    src={`gbshttp://plugin-repo-asset/${selectedPluginItem.repo.id}/${selectedPluginItem.plugin.id}/${url}`}
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
                      selectedPluginItem.plugin.id,
                      selectedPluginItem.plugin.type
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
                    selectedPluginItem.plugin.id,
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
