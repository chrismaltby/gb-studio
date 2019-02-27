import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button, {
  ButtonToolbar,
  ButtonToolbarSpacer
} from "../../components/library/Button";
import PageContent from "../../components/library/PageContent";
import { remote, shell, ipcRenderer } from "electron";
const { BrowserWindow } = remote;

class BuildPage extends Component {
  constructor(props) {
    super(props);
    this.scrollRef = React.createRef();
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  onClear = () => {
    this.props.consoleClear();
  };

  onRun = async e => {
    try {
      const { outputRoot } = await this.props.runBuild("web");
      ipcRenderer.send(
        "open-play",
        `file://${outputRoot}/build/web/index.html`
      );
    } catch (e) {
      console.error("FAIL");
      console.error(e);
    }
  };

  onBuild = buildType => async e => {
    await this.props.runBuild({ buildType, exportBuild: true });
    console.log("OPEN BUILD??");
    console.log(`${this.props.projectRoot}/build/${buildType}`);
    shell.openItem(`${this.props.projectRoot}/build/${buildType}`);
  };

  scrollToBottom = () => {
    const scrollEl = this.scrollRef.current;
    scrollEl.scrollTop = scrollEl.scrollHeight;
  };

  render() {
    const { status, output, projectRoot } = this.props;
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          ref={this.scrollRef}
          style={{
            flexGrow: 1,
            background: "#111",
            color: "#fff",
            padding: 20,
            fontFamily: "monospace",
            overflow: "auto"
          }}
        >
          {output.map((out, index) => (
            <div
              key={index}
              style={{ color: out.type === "err" ? "red" : "white" }}
            >
              {out.text}
            </div>
          ))}
        </div>
        <PageContent style={{ padding: 20, flexGrow: 0 }}>
          <ButtonToolbar>
            <Button onClick={this.onRun}>Run</Button>
            <Button onClick={this.onBuild("rom")}>Export ROM</Button>
            <Button onClick={this.onBuild("web")}>Export Web</Button>
            <ButtonToolbarSpacer />
            <Button onClick={this.onClear}>Clear</Button>
          </ButtonToolbar>
        </PageContent>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    projectRoot: state.document && state.document.root,
    status: state.console.status,
    output: state.console.output
  };
}

const mapDispatchToProps = {
  consoleClear: actions.consoleClear,
  runBuild: actions.runBuild
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BuildPage);
