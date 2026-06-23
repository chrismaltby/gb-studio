import React, { useCallback } from "react";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { Alert } from "ui/alerts/Alert";
import { Button } from "ui/buttons/Button";
import { CardAnchor, CardButtons, CardHeading } from "ui/cards/Card";
import { SearchableCard } from "ui/cards/SearchableCard";
import { Checkbox } from "ui/form/Checkbox";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { Select } from "ui/form/Select";
import settingsActions from "store/features/settings/settingsActions";
import { CartType } from "store/features/settings/settingsState";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface SettingsSectionCartProps {
  searchTerm: string;
}

interface CartTypeOption {
  value: CartType;
  label: string;
}

const cartOptions: CartTypeOption[] = [
  {
    value: "mbc5",
    label: "MBC5",
  },
  {
    value: "mbc3",
    label: "MBC3",
  },
];

export const SettingsSectionCart = ({
  searchTerm,
}: SettingsSectionCartProps) => {
  const dispatch = useAppDispatch();

  const cartType =
    useAppSelector((state) => state.project.present.settings.cartType) ||
    "mbc5";

  const batterylessEnabled = useAppSelector(
    (state) => state.project.present.settings.batterylessEnabled,
  );

  const onChangeCartType = useCallback(
    (cartType: CartType) => {
      dispatch(settingsActions.editSettings({ cartType }));
    },
    [dispatch],
  );

  const onToggleBatteryless = useCallback(() => {
    dispatch(
      settingsActions.editSettings({ batterylessEnabled: !batterylessEnabled }),
    );
  }, [dispatch, batterylessEnabled]);

  const onRestoreDefault = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        cartType: undefined,
        batterylessEnabled: false,
      }),
    );
  }, [dispatch]);

  const currentValue =
    cartOptions.find((option) => option.value === cartType) || cartOptions[0];

  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[l10n("SETTINGS_CART_TYPE")]}
    >
      <CardAnchor id="settingsCartType" />
      <CardHeading>{l10n("SETTINGS_CART_TYPE")}</CardHeading>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("SETTINGS_CART_TYPE")]}
      >
        <SettingRowLabel>{l10n("SETTINGS_CART_TYPE")}</SettingRowLabel>
        <SettingRowInput>
          <Select
            value={currentValue}
            options={cartOptions}
            onChange={(newValue: SingleValue<CartTypeOption>) => {
              if (newValue) {
                onChangeCartType(newValue.value);
              }
            }}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_CART_BATTERYLESS")]}
      >
        <SettingRowLabel>{l10n("FIELD_CART_BATTERYLESS")}</SettingRowLabel>
        <SettingRowInput>
          <Checkbox
            id="batterylessEnabled"
            name="batterylessEnabled"
            checked={batterylessEnabled}
            onChange={onToggleBatteryless}
          />
          {batterylessEnabled && (
            <div style={{ marginTop: 3 }}>
              <Alert variant="warning">
                <p>{l10n("FIELD_CART_BATTERYLESS_MORE_INFO_1")}</p>
                <p>{l10n("FIELD_CART_BATTERYLESS_MORE_INFO_2")}</p>
                <p>{l10n("FIELD_CART_BATTERYLESS_MORE_INFO_3")}</p>
              </Alert>
            </div>
          )}
        </SettingRowInput>
      </SearchableSettingRow>

      {!searchTerm && (
        <CardButtons>
          <Button onClick={onRestoreDefault}>
            {l10n("FIELD_RESTORE_DEFAULT")}
          </Button>
        </CardButtons>
      )}
    </SearchableCard>
  );
};
