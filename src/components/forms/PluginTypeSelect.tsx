import React, { useMemo } from "react";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { Select, SelectCommonProps } from "ui/form/Select";
import type { PluginType } from "lib/pluginManager/types";

export type OptionalPluginType = PluginType | "";

interface PluginTypeSelectProps extends SelectCommonProps {
  name: string;
  value?: OptionalPluginType;
  onChange?: (newValue: OptionalPluginType) => void;
}

interface PluginTypeOption {
  value: OptionalPluginType;
  label: string;
}

export const PluginTypeSelect = ({
  name,
  value = "",
  onChange,
  ...selectProps
}: PluginTypeSelectProps) => {
  const options: PluginTypeOption[] = useMemo(
    () => [
      { value: "", label: l10n("FIELD_ALL_TYPES") },
      { value: "assetPack", label: l10n("FIELD_ASSET_PACK") },
      { value: "eventsPlugin", label: l10n("FIELD_EVENTS_PLUGIN") },
      { value: "enginePlugin", label: l10n("FIELD_ENGINE_PLUGIN") },
      { value: "lang", label: l10n("FIELD_LANGUAGE_PLUGIN") },
      { value: "template", label: l10n("FIELD_TEMPLATE_PLUGIN") },
      { value: "theme", label: l10n("MENU_THEME") },
    ],
    []
  );

  const currentValue = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<PluginTypeOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
      {...selectProps}
    />
  );
};
