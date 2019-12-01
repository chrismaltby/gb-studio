/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable react/no-multi-comp */
import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import AsyncPaginate, {
  reduceGroupedOptions
} from "react-select-async-paginate";
import l10n from "../../lib/helpers/l10n";

reduceGroupedOptions([], []);

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

export const FormField = ({
  halfWidth,
  thirdWidth,
  quarterWidth,
  children
}) => (
  <div
    className={cx(
      "FormField",
      {
        "FormField--HalfWidth": halfWidth
      },
      {
        "FormField--ThirdWidth": thirdWidth
      },
      {
        "FormField--QuarterWidth": quarterWidth
      }
    )}
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
  componentWillMount() {
    this.id = `toggle_${Math.random()
      .toString()
      .replace(/0\./, "")}`;
  }

  toggleOpen = () => {
    const { onToggle, open } = this.props;
    onToggle(!open);
  };

  render() {
    const { halfWidth, label, children, open } = this.props;
    return (
      <div
        className={cx("FormField", "FormField--Toggleable", {
          "FormField--HalfWidth": halfWidth
        })}
      >
        <label htmlFor={this.id}>
          <input
            id={this.id}
            type="checkbox"
            onChange={this.toggleOpen}
            checked={open}
          />
          <div className="FormCheckbox" />
          {label}
        </label>
        <div>{open && children}</div>
      </div>
    );
  }
}

ToggleableCheckBoxField.propTypes = {
  halfWidth: PropTypes.bool,
  children: PropTypes.node,
  label: PropTypes.node,
  open: PropTypes.bool,
  onToggle: PropTypes.func.isRequired
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

  loadOptions = (search, loadedOptions) => {
    const { options, grouped } = this.props;
    const searchLower = search.toLowerCase();
    const PER_PAGE = 20;

    if (grouped) {
      const pageGroupedOptions = options.map((group, index) => {
        const currentLength = loadedOptions[index]
          ? loadedOptions[index].options.length
          : 0;
        return {
          ...group,
          options: group.options
            .filter(({ label }) => label.toLowerCase().includes(searchLower))
            .slice(currentLength, currentLength + PER_PAGE)
        };
      });

      const pageGroupedTotal = pageGroupedOptions.reduce((memo, group) => {
        return memo + group.options.length;
      }, 0);

      return {
        options: pageGroupedOptions,
        hasMore: pageGroupedTotal > 0
      };
    }

    const pageOptions = options
      .filter(({ label }) => label.toLowerCase().includes(searchLower))
      .slice(loadedOptions.length, loadedOptions.length + PER_PAGE);
    const pageTotal = pageOptions.length;
    return {
      options: pageOptions,
      hasMore: pageTotal > 0
    };
  };

  render() {
    const {
      editPlaceholder,
      editDefaultValue,
      id,
      value,
      onChange,
      grouped
    } = this.props;
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
          <AsyncPaginate
            id={id}
            className="ReactSelectContainer"
            classNamePrefix="ReactSelect"
            value={value}
            onChange={onChange}
            loadOptions={this.loadOptions}
            reduceOptions={grouped ? reduceGroupedOptions : undefined}
          />
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
  id: PropTypes.string,
  value: PropTypes.shape(),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  editDefaultValue: PropTypes.string,
  editPlaceholder: PropTypes.string,
  onRename: PropTypes.func.isRequired,
  grouped: PropTypes.bool
};

SelectRenamable.defaultProps = {
  id: undefined,
  value: undefined,
  editDefaultValue: "",
  editPlaceholder: "",
  grouped: false
};
