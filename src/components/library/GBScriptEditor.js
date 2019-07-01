import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import AceEditor from "react-ace";
import { NodeVM } from "vm2";
import { debounce } from "lodash";
import ScriptBuilder from "../../lib/compiler/scriptBuilder";

import "brace/ext/language_tools";
import "brace/theme/tomorrow";
import "brace/mode/javascript";
import "brace/ext/searchbox";
import {
  getSceneActors,
  getSpriteSheets
} from "../../reducers/entitiesReducer";
import { ActorShape, SpriteShape } from "../../reducers/stateShape";

const sb = new ScriptBuilder();

const vm = new NodeVM({
  timeout: 1000,
  sandbox: {}
});

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
  compile = debounce(inputCode => {
    const { actors, sprites } = this.props;
    try {
      const scriptBuilder = new ScriptBuilder([], {
        strings: [],
        variables: [],
        scenes: [],
        sprites,
        scene: {
          actors,
          triggers: []
        },
        compileEvents: () => {}
      });

      const code = `module.exports = function(helpers){
      Object.keys(helpers).forEach((key) => {
        this[key] = helpers[key];
      });
      ${inputCode}
      return helpers;
    }`;
      const helpers = {
        ...scriptBuilder
      };
      const handler = vm.run(code);
      handler(helpers);
      this.setState({
        errors: ""
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      this.setState({
        errors: e.toString()
      });
    }
  }, 1000);

  constructor() {
    super();
    this.aceEditor = React.createRef();
    this.state = {
      errors: ""
    };
  }

  componentDidMount() {
    this.aceEditor.current.editor.completers = [staticWordCompleter];
  }

  onChange = e => {
    const { onChange } = this.props;
    this.compile(e);
    onChange(e);
  };

  render() {
    const { value } = this.props;
    const { errors } = this.state;

    return (
      <div className="GBScriptEditor">
        {errors && <div className="GBScriptEditor__Error">{errors}</div>}
        <AceEditor
          ref={this.aceEditor}
          mode="javascript"
          theme="tomorrow"
          onChange={this.onChange}
          fontSize={10}
          highlightActiveLine
          editorProps={{
            $blockScrolling: true
          }}
          value={value}
          setOptions={{
            enableBasicAutocompletion: true,
            enableSnippets: false,
            showLineNumbers: true,
            tabSize: 2,
            useWorker: false
          }}
          minLines={10}
          maxLines={Infinity}
          width="auto"
        />
      </div>
    );
  }
}

GBScriptEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  actors: PropTypes.arrayOf(ActorShape),
  sprites: PropTypes.arrayOf(SpriteShape)
};

GBScriptEditor.defaultProps = {
  actors: [],
  sprites: []
};

function mapStateToProps(state) {
  const actors = getSceneActors(state, { id: state.editor.scene });
  const sprites = getSpriteSheets(state);
  return {
    actors,
    sprites
  };
}

export default connect(mapStateToProps)(GBScriptEditor);
