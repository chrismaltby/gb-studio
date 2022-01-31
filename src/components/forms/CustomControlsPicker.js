import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import l10n from "lib/helpers/l10n";
import { Button } from "ui/buttons/Button";
import settingsActions from "store/features/settings/settingsActions";
import { Input } from "ui/form/Input";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { CardButtons } from "ui/cards/Card";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import initElectronL10n from "lib/helpers/initElectronL10n";

// Make sure localisation has loaded so that
// l10n function can be used at top level
initElectronL10n();

const directions = [
  {
    key: "up",
    label: l10n("FIELD_DIRECTION_UP"),
  },
  {
    key: "down",
    label: l10n("FIELD_DIRECTION_DOWN"),
  },
  {
    key: "left",
    label: l10n("FIELD_DIRECTION_LEFT"),
  },
  {
    key: "right",
    label: l10n("FIELD_DIRECTION_RIGHT"),
  },
];

const buttons = [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
  {
    key: "start",
    label: "Start",
  },
  {
    key: "select",
    label: "Select",
  },
];

const keyMap = {
  up: "customControlsUp",
  down: "customControlsDown",
  left: "customControlsLeft",
  right: "customControlsRight",
  a: "customControlsA",
  b: "customControlsB",
  start: "customControlsStart",
  select: "customControlsSelect",
};

const defaultValues = {
  customControlsUp: ["ArrowUp", "w"],
  customControlsDown: ["ArrowDown", "s"],
  customControlsLeft: ["ArrowLeft", "a"],
  customControlsRight: ["ArrowRight", "d"],
  customControlsA: ["Alt", "z", "j"],
  customControlsB: ["Control", "k", "x"],
  customControlsStart: ["Enter"],
  customControlsSelect: ["Shift"],
};

class CustomControlsPicker extends Component {
  constructor() {
    super();
    this.inputRef = React.createRef();
  }

  onKeyDown = (input) => (e) => {
    const { settings, editProjectSettings } = this.props;
    e.preventDefault();
    const inputKey = keyMap[input];
    const currentValue = Array.isArray(settings[inputKey])
      ? settings[inputKey]
      : defaultValues[inputKey];
    e.currentTarget.blur();

    if (e.key === "Backspace" || e.key === "Delete") {
      editProjectSettings({
        [inputKey]: [],
      });
    } else {
      const patch = Object.values(keyMap).reduce((memo, otherInputKey) => {
        if (inputKey !== otherInputKey) {
          const otherValue = Array.isArray(settings[otherInputKey])
            ? settings[otherInputKey]
            : defaultValues[otherInputKey];
          if (otherValue.indexOf(e.key) > -1) {
            return {
              ...memo,
              [otherInputKey]: otherValue.filter((k) => k !== e.key),
            };
          }
          return memo;
        }
        if (currentValue.indexOf(e.key) > -1) {
          return {
            ...memo,
            [inputKey]: currentValue.filter((k) => k !== e.key),
          };
        }
        return {
          ...memo,
          [inputKey]: [].concat(currentValue, e.key),
        };
      }, {});
      editProjectSettings(patch);
    }
  };

  noop = () => {};

  onRestoreDefault = () => {
    const { editProjectSettings } = this.props;
    editProjectSettings(
      Object.keys(defaultValues).reduce((memo, key) => {
        return {
          ...memo,
          [key]: undefined,
        };
      }, {})
    );
  };

  render() {
    const { settings, searchTerm } = this.props;
    return (
      <>
        {directions.map((direction) => (
          <SearchableSettingRow
            key={direction.key}
            searchTerm={searchTerm}
            searchMatches={[direction.label]}
          >
            <SettingRowLabel>{direction.label}</SettingRowLabel>

            <SettingRowInput>
              <Input
                id="directionUp"
                value={(
                  settings[keyMap[direction.key]] ||
                  defaultValues[keyMap[direction.key]] ||
                  []
                ).join(", ")}
                onChange={this.noop}
                placeholder=""
                onKeyDown={this.onKeyDown(direction.key)}
              />
            </SettingRowInput>
          </SearchableSettingRow>
        ))}
        {buttons.map((button) => (
          <SearchableSettingRow
            key={button.key}
            searchTerm={searchTerm}
            searchMatches={[button.label]}
          >
            <SettingRowLabel>{button.label}</SettingRowLabel>
            <SettingRowInput>
              <Input
                id="buttonUp"
                value={(
                  settings[keyMap[button.key]] ||
                  defaultValues[keyMap[button.key]] ||
                  []
                ).join(", ")}
                onChange={this.noop}
                placeholder=""
                onKeyDown={this.onKeyDown(button.key)}
              />
            </SettingRowInput>
          </SearchableSettingRow>
        ))}
        <CardButtons>
          <Button onClick={this.onRestoreDefault}>
            {l10n("FIELD_RESTORE_DEFAULT")}
          </Button>
        </CardButtons>
      </>
    );
  }
}

const CustomControlPropType = PropTypes.arrayOf(PropTypes.string);

CustomControlsPicker.propTypes = {
  settings: PropTypes.shape({
    customControlsUp: CustomControlPropType,
    customControlsDown: CustomControlPropType,
    customControlsLeft: CustomControlPropType,
    customControlsRight: CustomControlPropType,
    customControlsA: CustomControlPropType,
    customControlsB: CustomControlPropType,
    customControlsStart: CustomControlPropType,
    customControlsSelect: CustomControlPropType,
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
