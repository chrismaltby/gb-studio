import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import settingsActions from "../../store/features/settings/settingsActions";
import { Select } from "../ui/form/Select";
import { Button } from "../ui/buttons/Button";
import { SearchableSettingRow } from "../ui/form/SearchableSettingRow";
import { CardButtons } from "../ui/cards/Card";
import { SettingRowInput, SettingRowLabel } from "../ui/form/SettingRow";

const cartOptions = [
  {
    value: "1B",
    label: "MBC5+RAM+BATTERY",
  },
  {
    value: "03",
    label: "MBC1+RAM+BATTERY",
  },
  {
    value: "1A",
    label: "MBC5+RAM",
  },
  {
    value: "02",
    label: "MBC1+RAM",
  },
];

class CustomControlsPicker extends Component {
  onChange = (cartType) => {
    const { editProjectSettings } = this.props;
    editProjectSettings({ cartType });
  };

  onRestoreDefault = () => {
    const { editProjectSettings } = this.props;
    editProjectSettings({ cartType: undefined });
  };

  render() {
    const { settings, searchTerm } = this.props;

    const cartType = settings.cartType || "1B";

    const currentValue = cartOptions.find(
      (option) => option.value === cartType
    );

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
              onChange={(newValue) => {
                this.onChange(newValue.value);
              }}
            />
          </SettingRowInput>
        </SearchableSettingRow>
        {!searchTerm && (
          <CardButtons>
            <Button onClick={this.onRestoreDefault}>
              {l10n("FIELD_RESTORE_DEFAULT")}
            </Button>
          </CardButtons>
        )}
      </>
    );
  }
}

CustomControlsPicker.propTypes = {
  settings: PropTypes.shape({
    cartType: PropTypes.string,
  }).isRequired,
  editProjectSettings: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
};

CustomControlsPicker.defaultProps = {
  searchTerm: "",
};

function mapStateToProps(state) {
  const settings = state.project.present.settings;
  return {
    settings,
  };
}

const mapDispatchToProps = {
  editProjectSettings: settingsActions.editSettings,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomControlsPicker);
