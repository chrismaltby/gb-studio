import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button, {
  ButtonToolbar,
  ButtonToolbarSpacer,
  ButtonToolbarFixedSpacer
} from "../../components/library/Button";
import PageContent from "../../components/library/PageContent";

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

  onRun = e => {
    this.props.buildGame();
  };

  onBuild = buildType => e => {
    this.props.buildGame({ buildType, exportBuild: true });
  };

  scrollToBottom = () => {
    const scrollEl = this.scrollRef.current;
    scrollEl.scrollTop = scrollEl.scrollHeight;
  };

  render() {
    const { output } = this.props;
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
            overflow: "auto",
            userSelect: "text"
          }}
        >
          {output.map((out, index) => (
            <div
              key={index}
              style={{ color: out.type === "err" ? "orange" : "white" }}
            >
              {out.text}
            </div>
          ))}
        </div>
        <PageContent style={{ padding: 20, flexGrow: 0 }}>
          <ButtonToolbar>
            <Button onClick={this.onRun}>Run</Button>
            <ButtonToolbarFixedSpacer style={{ width: 10 }} />
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
  buildGame: actions.buildGame
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BuildPage);
