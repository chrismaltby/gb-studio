import React, { Component } from "react";
import PropTypes from "prop-types";
import AceEditor from "react-ace";
import ScriptBuilder from "../../lib/compiler/scriptBuilder";

import "brace/ext/language_tools";
import "brace/theme/tomorrow";
import "brace/mode/javascript";
import "brace/ext/searchbox";

const sb = new ScriptBuilder();

const wordList = Object.keys(sb)
  .filter(key => {
    return typeof sb[key] === "function";
  })
  .map(key => {
    window.sb = sb;
    const fnArgs = String(sb[key])
      .replace(/[\s\S]=>[\s\S]+/g, "")
      .replace(/[()]/g, "")
      .replace(/(.*)/, "($1)");
    return {
      caption: key + fnArgs,
      value: key,
      meta: "function"
    };
  });

const staticWordCompleter = {
  getCompletions: (editor, session, pos, prefix, callback) => {
    callback(null, wordList);
  }
};

class GBScriptEditor extends Component {
  constructor() {
    super();
    this.aceEditor = React.createRef();
  }

  componentDidMount() {
    this.aceEditor.current.editor.completers = [staticWordCompleter];
  }

  render() {
    const { value, onChange } = this.props;

    return (
      <AceEditor
        ref={this.aceEditor}
        mode="javascript"
        theme="tomorrow"
        className="GBScriptEditor"
        onChange={onChange}
        fontSize={10}
        name="UNIQUE_ID_OF_DIV"
        highlightActiveLine
        editorProps={{
          $blockScrolling: true
        }}
        value={value}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2,
          useWorker: false
        }}
        minLines={10}
        maxLines={Infinity}
        width="auto"
      />
    );
  }
}

GBScriptEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

export default GBScriptEditor;
