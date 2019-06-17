/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable react/no-multi-comp */
import React, { Component } from "react";
import PropTypes from "prop-types";
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

Textarea.propTypes = {
  fixedSize: PropTypes.bool,
  small: PropTypes.bool,
  large: PropTypes.bool,
  borderless: PropTypes.bool
};

Textarea.defaultProps = {
  fixedSize: false,
  small: false,
  large: false,
  borderless: false
};

export const FormField = ({ halfWidth, thirdWidth, quarterWidth, children }) => (
  <div
    className={cx("FormField", {
      "FormField--HalfWidth": halfWidth
    }, {
      "FormField--ThirdWidth": thirdWidth
    }, {
      "FormField--QuarterWidth": quarterWidth
    })}
  >
    {children}
  </div>
);

FormField.propTypes = {
  halfWidth: PropTypes.bool,
  thirdWidth: PropTypes.bool,
  quarterWidth: PropTypes.bool,
  children: PropTypes.node
};

FormField.defaultProps = {
  halfWidth: false,
  thirdWidth: false,
  quarterWidth: false,
  children: null
};

export class ToggleableFormField extends Component {
  constructor() {
    super();
    this.state = {
      open: false
    };
  }

  onOpen = () => {
    this.setState({ open: true });
  };

  render() {
    const {
      halfWidth,
      htmlFor,
      label,
      closedLabel,
      children,
      open: propsOpen
    } = this.props;
    const { open: stateOpen } = this.state;
    const open = stateOpen || propsOpen;
    return (
      <div
        className={cx("FormField", "FormField--Toggleable", {
          "FormField--HalfWidth": halfWidth,
          "FormField--ToggleableClosed": !open
        })}
      >
        <label onClick={this.onOpen} htmlFor={htmlFor}>
          {open ? label : closedLabel}
          {open && children}
        </label>
      </div>
    );
  }
}

ToggleableFormField.propTypes = {
  halfWidth: PropTypes.bool,
  children: PropTypes.node,
  htmlFor: PropTypes.string,
  label: PropTypes.node,
  closedLabel: PropTypes.node,
  open: PropTypes.bool
};

ToggleableFormField.defaultProps = {
  halfWidth: false,
  children: null,
  htmlFor: "",
  label: null,
  closedLabel: null,
  open: false
};

export class ToggleableCheckBoxField extends Component {
  constructor() {
    super();
    this.state = {
      open: false
    };
  }

  toggleOpen = () => {
    const { onToggle } = this.props;
    onToggle(!this.state.open);

    this.setState({ open: !this.state.open });
  };

  componentWillMount () {
    this.id = `toggle_${Math.random().toString().replace(/0\./, '')}`;
  }

  render() {
    const {
      halfWidth,
      label,
      children,
      open: propsOpen
    } = this.props;
    const { open: stateOpen } = this.state;
    const open = stateOpen || propsOpen;
    return (
      <div
        className={cx("FormField", "FormField--Toggleable", {
          "FormField--HalfWidth": halfWidth
        })}
      >
        <input type="checkbox" onChange={this.toggleOpen} checked={open} id={this.id} style={{width:16,opacity:100,float:"left",position:"static"}}/>
        <label htmlFor={this.id}>{label}</label>
        <div>
          {open && children}
        </div>
      </div>
    );
  }
}

ToggleableCheckBoxField.propTypes = {
  halfWidth: PropTypes.bool,
  children: PropTypes.node,
  label: PropTypes.node,
  open: PropTypes.bool
};

ToggleableCheckBoxField.defaultProps = {
  halfWidth: false,
  children: null,
  label: null,
  open: false
};

export class SelectRenamable extends Component {
  constructor() {
    super();
    this.state = {
      edit: false,
      editValue: ""
    };
  }

  onStartEdit = () => {
    const { editDefaultValue } = this.props;
    this.setState({ edit: true, editValue: editDefaultValue });
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
    const { onRename } = this.props;
    const { editValue, edit } = this.state;
    if (edit) {
      onRename(editValue);
      this.setState({ edit: false, editValue: "" });
    }
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
            onBlur={this.onSave}
          />
        ) : (
          <select {...rest} />
        )}
        {edit ? (
          <div
            key="save"
            className="SelectRenamable__EditBtn SelectRenamable__SaveBtn"
            onClick={this.onSave}
          >
            {l10n("FIELD_SAVE")}
          </div>
        ) : (
          <div
            key="edit"
            className="SelectRenamable__EditBtn"
            onClick={this.onStartEdit}
          >
            {l10n("FIELD_RENAME")}
          </div>
        )}
      </div>
    );
  }
}

SelectRenamable.propTypes = {
  editDefaultValue: PropTypes.string,
  editPlaceholder: PropTypes.string,
  onRename: PropTypes.func.isRequired
};

SelectRenamable.defaultProps = {
  editDefaultValue: "",
  editPlaceholder: ""
};
