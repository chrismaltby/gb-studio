import React, { Component } from "react";
import PropTypes from "prop-types";
import { textNumLines } from "../../lib/helpers/trimlines";

class ScriptEventFormTextArea extends Component {
  onChange = e => {
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
    const { id, value, rows, placeholder } = this.props;
    return (
      <textarea
        id={id}
        value={value || ""}
        rows={rows || textNumLines(value)}
        placeholder={placeholder}
        onChange={this.onChange}
      />
    );
  }
}

ScriptEventFormTextArea.propTypes = {
    id: PropTypes.string,
    value: PropTypes.string,
    rows: PropTypes.number,
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired
}

ScriptEventFormTextArea.defaultProps = {
    id: undefined,
    value: "",
    rows: 3,
    placeholder: undefined
}

export default ScriptEventFormTextArea;
