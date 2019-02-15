import React, { Component } from "react";
import cx from "classnames";

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

  render() {
    const { editPlaceholder, editDefaultValue } = this.props;
    const { edit, editValue } = this.state;

    console.log({ editDefaultValue, editPlaceholder });

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
          />
        ) : (
          <select {...this.props} />
        )}
        {edit ? (
          <div className="SelectRenamable__EditBtn" onClick={this.onSave}>
            Save
          </div>
        ) : (
          <div className="SelectRenamable__EditBtn" onClick={this.onStartEdit}>
            Rename
          </div>
        )}
      </div>
    );
  }
}
