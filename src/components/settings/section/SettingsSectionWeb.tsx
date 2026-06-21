import React, { useCallback } from "react";
import l10n from "shared/lib/lang/l10n";
import settingsActions from "store/features/settings/settingsActions";
import { Textarea } from "ui/form/Textarea";
import { Button } from "ui/buttons/Button";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { WebTemplateSelect } from "components/forms/WebTemplateSelect";
import { SearchableCard } from "ui/cards/SearchableCard";
import { useAppDispatch, useAppSelector } from "store/hooks";
import buildGameActions from "store/features/buildGame/buildGameActions";
import { InputGroup, InputGroupAppend } from "ui/form/InputGroup";
import { EjectIcon } from "ui/icons/Icons";

interface SettingsSectionWebProps {
  searchTerm: string;
}

export const SettingsSectionWeb = ({ searchTerm }: SettingsSectionWebProps) => {
  const dispatch = useAppDispatch();

  const customHead = useAppSelector(
    (state) => state.project.present.settings.customHead,
  );
  const webTemplate = useAppSelector(
    (state) => state.project.present.settings.webTemplate,
  );

  const onChangeCustomHead = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      dispatch(
        settingsActions.editSettings({ customHead: e.currentTarget.value }),
      ),
    [dispatch],
  );

  const onChangeWebTemplate = useCallback(
    (webTemplate: string) => {
      dispatch(settingsActions.editSettings({ webTemplate }));
    },
    [dispatch],
  );

  const onEjectDefaultTemplate = useCallback(() => {
    dispatch(buildGameActions.ejectWebTemplate());
  }, [dispatch]);

  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[
        l10n("SETTINGS_WEB_EXPORT"),
        l10n("FIELD_WEB_TEMPLATE"),
        l10n("MENU_EJECT_WEB_TEMPLATE"),
      ]}
    >
      <CardAnchor id="settingsWeb" />
      <CardHeading>{l10n("SETTINGS_WEB_EXPORT")}</CardHeading>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[
          l10n("FIELD_WEB_TEMPLATE"),
          l10n("MENU_EJECT_WEB_TEMPLATE"),
        ]}
      >
        <SettingRowLabel>{l10n("FIELD_WEB_TEMPLATE")}</SettingRowLabel>
        <SettingRowInput>
          <InputGroup>
            <WebTemplateSelect
              value={webTemplate}
              onChange={onChangeWebTemplate}
            />
            <InputGroupAppend>
              <Button
                title={l10n("MENU_EJECT_WEB_TEMPLATE")}
                onClick={onEjectDefaultTemplate}
              >
                <EjectIcon />
              </Button>
            </InputGroupAppend>
          </InputGroup>
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_CUSTOM_HTML_HEADER")]}
      >
        <SettingRowLabel>{l10n("FIELD_CUSTOM_HTML_HEADER")}</SettingRowLabel>
        <SettingRowInput>
          <pre>
            &lt;!DOCTYPE html&gt;{"\n"}
            &lt;html&gt;{"\n  "}
            &lt;head&gt;{"\n  "}
            ...
          </pre>
          <Textarea
            id="customHead"
            value={customHead || ""}
            placeholder={
              'e.g. <style type"text/css">\nbody {\n  background-color: darkgreen;\n}\n</style>'
            }
            onChange={onChangeCustomHead}
            rows={15}
            style={{ fontFamily: "monospace" }}
          />
          <pre>
            {"  "}&lt;/head&gt;{"\n  "}
            &lt;body&gt;{"\n  "}
            ...{"\n  "}
            &lt;body&gt;{"\n"}
            &lt;html&gt;
          </pre>
        </SettingRowInput>
      </SearchableSettingRow>
    </SearchableCard>
  );
};
