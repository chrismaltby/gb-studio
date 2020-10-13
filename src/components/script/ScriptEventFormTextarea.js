import React, { Component } from "react";
import PropTypes from "prop-types";
import { totalLength, textNumLines } from "../../lib/helpers/trimlines";

class ScriptEventFormTextArea extends Component {
  onChange = (e) => {
    const { onChange } = this.props;
    const el = e.currentTarget;
    const cursorPosition = el.selectionStart;
    onChange(e);
    this.forceUpdate(() => {
      el.selectionStart = cursorPosition;
      el.selectionEnd = cursorPosition;
    });
  };

  render() {
    const { id, value, rows, placeholder, maxlength } = this.props;
    return (
      <div className="ScriptEventFormTextArea">
        <textarea
          id={id}
          value={value || ""}
          rows={rows || textNumLines(value)}
          placeholder={placeholder}
          onChange={this.onChange}
        />
        <div className="ScriptEventFormTextArea__Stats">
          {totalLength(value)} / {maxlength}
        </div>
      </div>
    );
  }
}

ScriptEventFormTextArea.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  rows: PropTypes.number,
  maxlength: PropTypes.number,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

ScriptEventFormTextArea.defaultProps = {
  id: undefined,
  value: "",
  rows: undefined,
  maxlength: 52,
  placeholder: undefined,
};

export default ScriptEventFormTextArea;
