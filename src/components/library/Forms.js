import React, { Component } from "react";
import cx from "classnames";
import l10n from "../../lib/helpers/l10n";

export const Textarea = ({ small, large, borderless, fixedSize, ...props }) => (
  <textarea
    className={cx("Textarea", {
      "Textarea--FixedSize": fixedSize,
      "Textarea--Large": large,
      "Textarea--Small": small,
      "Textarea--Borderless": borderless
    })}
    {...props}
  />
);

export const FormField = ({ halfWidth, children }) => (
  <div
    className={cx("FormField", {
      "FormField--HalfWidth": halfWidth
    })}
  >
    {children}
  </div>
);

export class SelectRenamable extends Component {
  constructor() {
    super();
    this.state = {
      edit: false,
      editValue: ""
    };
  }

  onStartEdit = () => {
    this.setState({ edit: true, editValue: this.props.editDefaultValue });
  };

  onKeyDown = e => {
    if (e.key === "Enter") {
      this.onSave();
    }
  };

  onChangeName = e => {
    this.setState({
      editValue: e.currentTarget.value
    });
  };

  onSave = () => {
    const { editValue } = this.state;
    this.props.onRename(editValue);
    this.setState({ edit: false, editValue: "" });
  };

  onFocus = e => {
    e.target.select();
  };

  render() {
    const { editPlaceholder, editDefaultValue, onRename, ...rest } = this.props;
    const { edit, editValue } = this.state;

    return (
      <div className="SelectRenamable">
        {edit ? (
          <input
            key={editDefaultValue}
            placeholder={editPlaceholder}
            value={editValue}
            onKeyDown={this.onKeyDown}
            onChange={this.onChangeName}
            autoFocus
            onFocus={this.onFocus}
          />
        ) : (
          <select {...rest} />
        )}
        {edit ? (
          <div className="SelectRenamable__EditBtn" onClick={this.onSave}>
            {l10n("FIELD_SAVE")}
          </div>
        ) : (
          <div className="SelectRenamable__EditBtn" onClick={this.onStartEdit}>
            {l10n("FIELD_RENAME")}
          </div>
        )}
      </div>
    );
  }
}
