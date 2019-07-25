import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import * as actions from "../../actions";
import GBControlsPreview from "../library/GBControlsPreview";
import { FormField } from "../library/Forms";

const directions = [
  {
    key: "up",
    label: "Up",
    settingKey: "customControlsUp",
    defaultValue: ["ArrowUp", "w"]
  },
  {
    key: "down",
    label: "Down",
    settingKey: "customControlsDown",
    defaultValue: ["ArrowDown", "s"]
  },
  {
    key: "left",
    label: "Left",
    settingKey: "customControlsLeft",
    defaultValue: ["ArrowLeft", "a"]
  },
  {
    key: "right",
    label: "Right",
    settingKey: "customControlsRights",
    defaultValue: ["ArrowRight", "d"]
  }
];
const buttons = [
  { key: "a", label: "A", settingKey: "customControlsA", defaultValue: ["z"] },
  { key: "b", label: "B", settingKey: "customControlsB", defaultValue: ["x"] },
  {
    key: "start",
    label: "Start",
    settingKey: "customControlsStart",
    defaultValue: ["Enter"]
  },
  {
    key: "select",
    label: "Select",
    settingKey: "customControlsSelect",
    defaultValue: ["Shift"]
  }
];

class CustomControlsPicker extends Component {
  constructor() {
    super();
    this.inputRef = React.createRef();
    this.state = {
      input: ""
    };
  }

  onKeyDown = e => {
    const { input } = this.state;
    if (input) {
      e.preventDefault();
      console.log("SET INPUT", input, e.key);
      this.setState({ input: "" });
      this.inputRef.current.blur();
    }
  };

  onSelectInput = input => {
    // console.log({ input });
    this.setState({ input });
    this.inputRef.current.focus();
  };

  onFocus = input => e => {
    // e.currentTarget.blur();
    this.setState({ input });
    this.inputRef.current.focus();
  };

  onBlur = e => {
    this.setState({ input: "" });
  };

  onChange = input => value => {};

  render() {
    const { settings } = this.props;
    const { input } = this.state;
    return (
      <div className="CustomControlsPicker">
        <div className="CustomControlsPicker__Columns">
          <div className="CustomControlsPicker__Column">
            {directions.map(direction => (
              <FormField key={direction.key}>
                <label htmlFor="directionUps">
                  {direction.label}
                  <input
                    id="directionUp"
                    value={(
                      settings[direction.settingKey] || direction.defaultValue
                    ).join(", ")}
                    placeholder=""
                    className={cx("CustomControlsPicker__Input", {
                      "CustomControlsPicker__Input--Focus":
                        direction.key === input
                    })}
                    onChange={this.onChange(direction.key)}
                    onFocus={this.onFocus(direction.key)}
                  />
                </label>
              </FormField>
            ))}
          </div>
          <div className="CustomControlsPicker__Column">
            {buttons.map(button => (
              <FormField key={button.key}>
                <label htmlFor="buttonUps">
                  {button.label}
                  <input
                    id="buttonUp"
                    value={(
                      settings[button.settingKey] || button.defaultValue
                    ).join(", ")}
                    placeholder=""
                    className={cx("CustomControlsPicker__Input", {
                      "CustomControlsPicker__Input--Focus": button.key === input
                    })}
                    onChange={this.onChange(button.key)}
                    onFocus={this.onFocus(button.key)}
                  />
                </label>
              </FormField>
            ))}
          </div>
          <div
            className="CustomControlsPicker__Column"
            style={{ marginTop: 30 }}
          >
            <GBControlsPreview selected={input} onSelect={this.onSelectInput} />
          </div>
        </div>
        <input
          className="CustomControlsPicker__HiddenInput"
          ref={this.inputRef}
          onKeyDown={this.onKeyDown}
          onBlur={this.onBlur}
        />
        <button>Restore Defaults</button>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const project = state.entities.present.result;
  const { settings } = project;
  return {
    settings
  };
}

const mapDispatchToProps = {
  editProjectSettings: actions.editProjectSettings
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomControlsPicker);
