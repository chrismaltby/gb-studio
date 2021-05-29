import React, { useCallback } from "react";
import l10n from "lib/helpers/l10n";
import settingsActions from "store/features/settings/settingsActions";
import { Select } from "ui/form/Select";
import { Button } from "ui/buttons/Button";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { CardButtons } from "ui/cards/Card";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { useDispatch, useSelector } from "react-redux";
import { CartType } from "store/features/settings/settingsState";
import { RootState } from "store/configureStore";
import { Checkbox } from "ui/form/Checkbox";

export interface CartSettingsEditorProps {
  searchTerm?: string;
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

const CartSettingsEditor = ({ searchTerm }: CartSettingsEditorProps) => {
  const dispatch = useDispatch();

  const cartType =
    useSelector(
      (state: RootState) => state.project.present.settings.cartType
    ) || "mbc5";

  const batterylessEnabled = useSelector(
    (state: RootState) => state.project.present.settings.batterylessEnabled
  );

  const onChangeCartType = useCallback(
    (cartType: CartType) => {
      dispatch(settingsActions.editSettings({ cartType }));
    },
    [dispatch]
  );

  const onToggleBatteryless = useCallback(() => {
    dispatch(
      settingsActions.editSettings({ batterylessEnabled: !batterylessEnabled })
    );
  }, [dispatch, batterylessEnabled]);

  const onRestoreDefault = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        cartType: undefined,
        batterylessEnabled: false,
      })
    );
  }, [dispatch]);

  const currentValue =
    cartOptions.find((option) => option.value === cartType) || cartOptions[0];

  return (
    <>
      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("SETTINGS_CART_TYPE")]}
      >
        <SettingRowLabel>{l10n("SETTINGS_CART_TYPE")}</SettingRowLabel>
        <SettingRowInput>
          <Select
            value={currentValue}
            options={cartOptions}
            onChange={(newValue: CartTypeOption) => {
              onChangeCartType(newValue.value);
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
        </SettingRowInput>
      </SearchableSettingRow>
      {!searchTerm && (
        <CardButtons>
          <Button onClick={onRestoreDefault}>
            {l10n("FIELD_RESTORE_DEFAULT")}
          </Button>
        </CardButtons>
      )}
    </>
  );
};

export default CartSettingsEditor;
