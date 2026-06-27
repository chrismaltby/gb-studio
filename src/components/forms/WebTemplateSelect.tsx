import React, { memo, useMemo } from "react";
import { SingleValue } from "react-select";
import {
  OptGroup,
  Option,
  Select,
  SelectCommonProps,
  OptionLabelWithInfo,
} from "ui/form/Select";
import type { WebTemplateInfo } from "shared/lib/webTemplates/types";
import { useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";

interface WebTemplateSelectProps extends SelectCommonProps {
  value?: string;
  onChange?: (newValue: string) => void;
}

const webTemplateFolderName = (template: string) =>
  template.split(/[\\/]/).pop() || template;

const webTemplateLabel = (template: WebTemplateInfo) =>
  template.name.trim() || webTemplateFolderName(template.id);

const webTemplatePlugin = (template: string) => {
  if (!template.startsWith("plugins/")) {
    return "";
  }
  return template.split(/[\\/]/).slice(0, -1).join("/");
};

const WebTemplateSelectComponent = ({
  value = "",
  onChange,
  ...selectProps
}: WebTemplateSelectProps) => {
  const webTemplates = useAppSelector((state) => state.webTemplates.templates);
  const defaultWebTemplateLabel = l10n("FIELD_DEFAULT_WEB_TEMPLATE_BINJGB");

  const options = useMemo<(Option | OptGroup)[]>(() => {
    const localOptions: Option[] = [
      { value: "", label: defaultWebTemplateLabel },
    ];
    const pluginOptions: Record<string, Option[]> = {};

    webTemplates.forEach((template) => {
      const option = {
        value: template.id,
        label: webTemplateLabel(template),
      };
      const plugin = webTemplatePlugin(template.id);

      if (plugin) {
        pluginOptions[plugin] = pluginOptions[plugin] || [];
        pluginOptions[plugin].push(option);
      } else {
        localOptions.push(option);
      }
    });

    return [
      ...localOptions,
      ...Object.entries(pluginOptions).map(([plugin, options]) => ({
        label: plugin,
        options,
      })),
    ];
  }, [defaultWebTemplateLabel, webTemplates]);

  const flatOptions = useMemo(
    () =>
      options.flatMap((option) =>
        "options" in option ? option.options : option,
      ),
    [options],
  );

  const currentValue =
    flatOptions.find((option) => option.value === value) ||
    (value
      ? {
          value,
          label: webTemplateFolderName(value),
        }
      : { value: "", label: defaultWebTemplateLabel });

  const onSelectChange = (newValue: SingleValue<Option>) => {
    onChange?.(newValue?.value || "");
  };

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(
        option: Option,
        { context }: { context: "menu" | "value" },
      ) => {
        return (
          <OptionLabelWithInfo info={context === "menu" ? option.value : ""}>
            {option.label}
          </OptionLabelWithInfo>
        );
      }}
      {...selectProps}
    />
  );
};

export const WebTemplateSelect = memo<WebTemplateSelectProps>(
  WebTemplateSelectComponent,
);
