import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button, {
  ButtonToolbar,
  ButtonToolbarSpacer
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

  onRun = () => {
    alert("RUN BUILD");
    this.props.runBuild();
  };

  scrollToBottom = () => {
    const scrollEl = this.scrollRef.current;
    scrollEl.scrollTop = scrollEl.scrollHeight;
    // debugger;
    // this.scrollRef.current.scrollIntoView({ behavior: "smooth" });
  };

  render() {
    const { status, output } = this.props;
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
        <PageContent style={{ padding: 20 }}>
          <ButtonToolbar>
            <Button onClick={this.onRun}>Run</Button>
            <Button>Export ROM</Button>
            <Button>Export Web</Button>
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
