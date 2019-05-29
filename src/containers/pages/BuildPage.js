import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button, {
  ButtonToolbar,
  ButtonToolbarSpacer,
  ButtonToolbarFixedSpacer
} from "../../components/library/Button";
import PageContent from "../../components/library/PageContent";
import l10n from "../../lib/helpers/l10n";

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
    const { consoleClear } = this.props;
    consoleClear();
  };

  onRun = e => {
    const { buildGame } = this.props;
    buildGame();
  };

  onBuild = buildType => e => {
    const { buildGame } = this.props;
    buildGame({ buildType, exportBuild: true });
  };

  scrollToBottom = () => {
    const scrollEl = this.scrollRef.current;
    scrollEl.scrollTop = scrollEl.scrollHeight;
  };

  render() {
    const { output, warnings, status } = this.props;
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
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              style={{ color: out.type === "err" ? "orange" : "white" }}
            >
              {out.text}
            </div>
          ))}
          {status === "complete" && warnings.length > 0 && (
            <div>
              <br />
              Warnings:
              {warnings.map((out, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} style={{ color: "orange" }}>
                  - {out.text}
                </div>
              ))}
            </div>
          )}
        </div>
        <PageContent style={{ padding: 20, flexGrow: 0 }}>
          <ButtonToolbar>
            <Button onClick={this.onRun}>{l10n("BUILD_RUN")}</Button>
            <ButtonToolbarFixedSpacer style={{ width: 10 }} />
            <Button onClick={this.onBuild("rom")}>
              {l10n("BUILD_EXPORT_ROM")}
            </Button>
            <Button onClick={this.onBuild("web")}>
              {l10n("BUILD_EXPORT_WEB")}
            </Button>
            <ButtonToolbarSpacer />
            <Button onClick={this.onClear}>{l10n("BUILD_CLEAR")}</Button>
          </ButtonToolbar>
        </PageContent>
      </div>
    );
  }
}

BuildPage.propTypes = {
  status: PropTypes.string.isRequired,
  output: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired
    })
  ).isRequired,
  warnings: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired
    })
  ).isRequired,
  buildGame: PropTypes.func.isRequired,
  consoleClear: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return {
    status: state.console.status,
    output: state.console.output,
    warnings: state.console.warnings
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
