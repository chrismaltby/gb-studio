import React, { useCallback } from "react";
import l10n from "shared/lib/lang/l10n";
import settingsActions from "store/features/settings/settingsActions";
import { Textarea } from "ui/form/Textarea";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface SettingsSectionWebProps {
  searchTerm: string;
}

export const SettingsSectionWeb = ({ searchTerm }: SettingsSectionWebProps) => {
  const dispatch = useAppDispatch();

  const customHead = useAppSelector(
    (state) => state.project.present.settings.customHead,
  );

  const onChangeCustomHead = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      dispatch(
        settingsActions.editSettings({ customHead: e.currentTarget.value }),
      ),
    [dispatch],
  );

  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[l10n("FIELD_CUSTOM_HTML_HEADER")]}
    >
      <CardAnchor id="settingsCustomHead" />
      <CardHeading>{l10n("SETTINGS_CUSTOM_HEADER")}</CardHeading>
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
