import React, { useEffect, useMemo, useState } from "react";
import Path from "path";
import FocusLock from "react-focus-lock";
import { FlexGrow } from "ui/spacing/Spacing";
import {
  SplashAppTitle,
  SplashContent,
  SplashCreateButton,
  SplashEasterEggButton,
  SplashForm,
  SplashInfoMessage,
  SplashLoading,
  SplashLogo,
  SplashOpenButton,
  SplashProject,
  SplashProjectClearButton,
  SplashScroll,
  SplashSidebar,
  SplashTab,
  SplashTemplateSelect,
  SplashWindow,
} from "ui/splash/Splash";
import GlobalStyle from "ui/globalStyle";
import ThemeProvider from "ui/theme/ThemeProvider";
import logoFile from "ui/icons/GBStudioLogo.png";
import { FormField, FormRow } from "ui/form/FormLayout";
import { TextField } from "ui/form/TextField";
import { DotsIcon, LoadingIcon } from "ui/icons/Icons";
import { Button } from "ui/buttons/Button";
import contributors from "contributors.json";
import contributorsExternal from "contributors-external.json";
import inbuiltPatrons from "patrons.json";
import gbs2Preview from "assets/templatePreview/gbs2.png";
import gbhtmlPreview from "assets/templatePreview/gbhtml.png";
import blankPreview from "assets/templatePreview/blank.png";
import useWindowFocus from "ui/hooks/use-window-focus";
import l10n from "shared/lib/lang/l10n";
import API from "renderer/lib/api";
import { ERR_PROJECT_EXISTS } from "consts";
import type { RecentProjectData } from "renderer/lib/api/setup";
import type { Patrons } from "scripts/fetchPatrons";
import {
  Credits,
  CreditsPerson,
  CreditsGrid,
  CreditsSubHeading,
  CreditsTitle,
} from "ui/splash/credits/Credits";

declare const DOCS_URL: string;

type TemplateInfo = {
  id: string;
  name: string;
  preview: string;
  videoPreview: boolean;
  description: string;
};

const splashTabs = ["new", "recent"] as const;
type SplashTabSection = typeof splashTabs[number];

const getLastUsedPath = async () => {
  const storedPath = String(await API.settings.get("__lastUsedPath"));
  if (storedPath && storedPath !== "undefined") {
    return Path.normalize(storedPath);
  }
  return API.paths.getDocumentsPath();
};

const setLastUsedPath = (path: string) => {
  API.settings.set("__lastUsedPath", path);
};

const getLastUsedTab = async () => {
  return String(await API.settings.get("__lastUsedSplashTab")) || "info";
};

const setLastUsedTab = (tab: string) => {
  API.settings.set("__lastUsedSplashTab", tab);
};

const toSplashTab = (tab: string): SplashTabSection => {
  if (splashTabs.indexOf(tab as unknown as SplashTabSection) > -1) {
    return tab as SplashTabSection;
  }
  return "new";
};

const botContributors = ["dependabot[bot]"];

const filteredContributors = contributors.filter((user) => {
  return !botContributors.includes(user.login);
});

const goldContributors = filteredContributors.filter(
  (user) => user.contributions >= 10
);
const silverContributors = [...contributorsExternal]
  // eslint-disable-next-line camelcase
  .map((contributor) => ({
    ...contributor,
    // eslint-disable-next-line camelcase
    html_url: contributor.html_url ?? "",
  }))
  .concat(filteredContributors.filter((user) => user.contributions < 10))
  .sort((a, b) => {
    const loginA = a.login.toLowerCase();
    const loginB = b.login.toLowerCase();
    if (loginA < loginB) return -1;
    if (loginA > loginB) return 1;
    return 0;
  });

export const Splash = () => {
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState("gbs2");
  const [section, setSection] = useState<SplashTabSection>();
  const [openCredits, setOpenCredits] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProjectData[]>([]);
  const [name, setName] = useState<string>(l10n("SPLASH_DEFAULT_PROJECT_NAME"));
  const [path, setPath] = useState<string>("");
  const [nameError, setNameError] = useState("");
  const [pathError, setPathError] = useState("");
  const [creating, setCreating] = useState(false);
  const windowFocus = useWindowFocus();

  const [patrons, setPatrons] = useState<Patrons>(inbuiltPatrons as Patrons);

  useEffect(() => {
    async function fetchData() {
      setRecentProjects((await API.project.getRecentProjects()).reverse());
      setPath(await getLastUsedPath());
      const urlParams = new URLSearchParams(window.location.search);
      const forceTab = urlParams.get("tab");
      const initialTab = toSplashTab(forceTab || (await getLastUsedTab()));
      setSection(initialTab);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    API.app.getPatrons().then(setPatrons);
  }, []);

  const templates: TemplateInfo[] = useMemo(
    () => [
      {
        id: "gbs2",
        name: l10n("SPLASH_SAMPLE_PROJECT"),
        preview: gbs2Preview,
        videoPreview: false,
        description: l10n("SPLASH_SAMPLE_PROJECT_DESCRIPTION"),
      },
      {
        id: "gbhtml",
        name: `${l10n("SPLASH_SAMPLE_PROJECT")} (GBS 1.0)`,
        preview: gbhtmlPreview,
        videoPreview: false,
        description: l10n("SPLASH_SAMPLE_PROJECT_ORIGINAL_DESCRIPTION"),
      },
      {
        id: "blank",
        name: l10n("SPLASH_BLANK_PROJECT"),
        preview: blankPreview,
        videoPreview: false,
        description: l10n("SPLASH_BLANK_PROJECT_DESCRIPTION"),
      },
    ],
    []
  );

  const onSetTab = (tab: SplashTabSection) => () => {
    setSection(tab);
    setLastUsedTab(tab);
  };

  const onOpen = () => {
    API.project.openProjectPicker();
  };

  const onOpenRecent = (projectPath: string) => async () => {
    const success = await API.project.openProject(projectPath);
    if (!success) {
      setRecentProjects((await API.project.getRecentProjects()).reverse());
    }
  };

  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.currentTarget.value;
    setName(newName);
    setNameError("");
  };

  const onChangePath = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.currentTarget.value;
    setLastUsedPath(newPath);
    setPath(newPath);
    setPathError("");
  };

  const onSelectFolder = async () => {
    const directory = await API.dialog.chooseDirectory();
    if (directory) {
      setLastUsedPath(directory);
      setPath(directory);
      setPathError("");
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name) {
      setNameError(l10n("ERROR_PLEASE_ENTER_PROJECT_NAME"));
      return;
    }

    if (!path) {
      setPathError(l10n("ERROR_PLEASE_ENTER_PROJECT_PATH"));
      return;
    }

    try {
      setCreating(true);
      const projectPath = await API.project.createProject({
        name,
        template: templateId,
        path,
      });
      API.project.openProject(projectPath);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes(ERR_PROJECT_EXISTS)) {
          setNameError(l10n("ERROR_PROJECT_ALREADY_EXISTS"));
          setCreating(false);
        } else if (
          err.message.includes("ENOTDIR") ||
          err.message.includes("EEXIST") ||
          err.message.includes("EROFS")
        ) {
          setPathError(l10n("ERROR_PROJECT_PATH_INVALID"));
          setCreating(false);
        } else {
          setPathError(err.message);
          setCreating(false);
        }
      }
    }
  };

  const clearRecent = () => {
    setRecentProjects([]);
    API.project.clearRecentProjects();
  };

  const removeRecent = (path: string) => {
    API.project.removeRecentProject(path);
    setRecentProjects(recentProjects.filter((p) => p.path !== path));
  };

  useEffect(() => {
    if (
      section !== undefined &&
      document.activeElement instanceof HTMLElement
    ) {
      // Prevent documentation tab getting visible focus
      // before interaction has occured
      document.activeElement.blur();
    }
  }, [section]);

  return (
    <ThemeProvider>
      <GlobalStyle />
      <SplashWindow focus={windowFocus}>
        <SplashSidebar>
          <SplashLogo>
            <img src={logoFile} alt="GB Studio" />
            <SplashEasterEggButton
              onClick={() => setOpenCredits(true)}
              tabIndex={-1}
            />
          </SplashLogo>
          <SplashAppTitle />
          <SplashTab
            selected={section === "new"}
            onClick={onSetTab("new")}
            disabled={loading}
          >
            {l10n("SPLASH_NEW")}
          </SplashTab>
          <SplashTab
            selected={section === "recent"}
            onClick={onSetTab("recent")}
            disabled={loading}
          >
            {l10n("SPLASH_RECENT")}
          </SplashTab>
          <SplashTab onClick={() => API.app.openExternal(DOCS_URL)}>
            {l10n("SPLASH_DOCUMENTATION")}
          </SplashTab>
          <SplashTab onClick={() => setOpenCredits(true)}>
            {l10n("SPLASH_CREDITS")}
          </SplashTab>
          <FlexGrow />
          <SplashOpenButton onClick={onOpen}>
            {l10n("SPLASH_OPEN")}
          </SplashOpenButton>
        </SplashSidebar>

        {loading && !section && (
          <SplashContent>
            <SplashLoading>
              <LoadingIcon />
            </SplashLoading>
          </SplashContent>
        )}

        {section === "new" && (
          <SplashContent>
            <SplashForm onSubmit={!creating ? onSubmit : undefined}>
              <FormRow>
                <TextField
                  name="name"
                  label={l10n("SPLASH_PROJECT_NAME")}
                  errorLabel={nameError}
                  size="large"
                  value={name}
                  onChange={onChangeName}
                />
              </FormRow>
              <FormRow>
                <TextField
                  name="path"
                  label={l10n("SPLASH_PATH")}
                  errorLabel={pathError}
                  size="large"
                  value={path}
                  onChange={onChangePath}
                  additionalRight={
                    <Button onClick={onSelectFolder} type="button">
                      <DotsIcon />
                    </Button>
                  }
                />
              </FormRow>
              <FormRow>
                <FormField
                  name="template"
                  label={l10n("SPLASH_PROJECT_TEMPLATE")}
                >
                  <SplashTemplateSelect
                    name="template"
                    templates={templates}
                    value={templateId}
                    onChange={setTemplateId}
                  />
                </FormField>
              </FormRow>
              <FlexGrow />
              <SplashCreateButton>
                <Button variant="primary" size="large">
                  {creating ? l10n("SPLASH_CREATING") : l10n("SPLASH_CREATE")}
                </Button>
              </SplashCreateButton>
            </SplashForm>
          </SplashContent>
        )}

        {section === "recent" && (
          <SplashScroll>
            {recentProjects.map((project, index) => (
              <SplashProject
                key={index}
                project={project}
                onClick={onOpenRecent(project.path)}
                onRemove={() => removeRecent(project.path)}
              />
            ))}

            {recentProjects.length > 0 ? (
              <SplashProjectClearButton>
                <Button onClick={clearRecent}>
                  {l10n("SPLASH_CLEAR_RECENT")}
                </Button>
              </SplashProjectClearButton>
            ) : (
              <SplashInfoMessage>
                {l10n("SPLASH_NO_RECENT_PROJECTS")}
              </SplashInfoMessage>
            )}
          </SplashScroll>
        )}
      </SplashWindow>

      {openCredits && (
        <FocusLock>
          <Credits onClose={() => setOpenCredits(false)}>
            <CreditsTitle>GB Studio</CreditsTitle>
            <CreditsSubHeading>{l10n("SPLASH_CONTRIBUTORS")}</CreditsSubHeading>
            {goldContributors.map((contributor) => (
              <CreditsPerson
                key={contributor.id}
                onClick={
                  contributor.html_url
                    ? () => API.app.openExternal(contributor.html_url)
                    : undefined
                }
              >
                {contributor.login}
              </CreditsPerson>
            ))}
            <CreditsGrid>
              {silverContributors.map((contributor) => (
                <CreditsPerson
                  key={contributor.login}
                  onClick={
                    contributor.html_url
                      ? () => API.app.openExternal(contributor.html_url)
                      : undefined
                  }
                >
                  {contributor.login}
                </CreditsPerson>
              ))}
            </CreditsGrid>
            <CreditsSubHeading>Patrons</CreditsSubHeading>
            <CreditsGrid>
              {(patrons.goldTier || []).map((patron) => (
                <CreditsPerson key={patron.id} gold>
                  {patron.attributes.full_name}
                </CreditsPerson>
              ))}
            </CreditsGrid>
            <CreditsGrid>
              {(patrons.silverTier || []).map((patron) => (
                <CreditsPerson key={patron.id}>
                  {patron.attributes.full_name}
                </CreditsPerson>
              ))}
            </CreditsGrid>
            <CreditsGrid>
              {(patrons.pastPatrons || []).map((patron) => (
                <CreditsPerson key={patron.id}>
                  {patron.attributes.full_name}
                </CreditsPerson>
              ))}
            </CreditsGrid>
          </Credits>
        </FocusLock>
      )}
    </ThemeProvider>
  );
};

export default Splash;
