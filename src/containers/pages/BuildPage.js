import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button, {
  ButtonToolbar,
  ButtonToolbarSpacer,
  ButtonToolbarFixedSpacer
} from "../../components/library/Button";
import PageContent from "../../components/library/PageContent";
import l10n from "../../lib/helpers/l10n";
import editorActions from "../../store/features/editor/editorActions";
import consoleActions from "../../store/features/console/consoleActions";
import buildGameActions from "../../store/features/buildGame/buildGameActions";

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
    const { clearConsole } = this.props;
    clearConsole();
  };

  onRun = e => {
    const { buildGame } = this.props;
    buildGame();
  };

  onBuild = buildType => e => {
    const { buildGame } = this.props;
    buildGame({ buildType, exportBuild: true });
  };

  onDeleteCache = () => {
    const { deleteBuildCache } = this.props;
    deleteBuildCache();
  }

  onToggleProfiling = () => {
    const { setProfiling, profile } = this.props;
    setProfiling(!profile);
  }

  scrollToBottom = () => {
    const scrollEl = this.scrollRef.current;
    scrollEl.scrollTop = scrollEl.scrollHeight;
  };

  render() {
    const { output, warnings, status, profile } = this.props;

    // Only show the latest 100 lines during build
    // show full output on complete
    const outputLines = status === "complete"
      ? output
      : output.slice(-100);

    return (
      <div
        style={{
          width: "100%",
          height: "calc(100vh - 38px)",
          display: "flex",
          flexDirection: "column",
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
            userSelect: "text",
          }}
        >
          {outputLines.map((out, index) => (
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
            <Button onClick={this.onDeleteCache}>
              {l10n("BUILD_EMPTY_BUILD_CACHE")}
            </Button>
            {process.env.NODE_ENV !== "production" && (
              <>
                <ButtonToolbarFixedSpacer style={{ width: 10 }} />
                <label htmlFor="enableProfile">
                  <input
                    id="enableProfile"
                    type="checkbox"
                    checked={profile}
                    onChange={this.onToggleProfiling}
                  />{" "}
                  Enable BGB Profiling
                </label>
              </>
            )}
            <ButtonToolbarSpacer />
            <Button onClick={this.onClear}>{l10n("BUILD_CLEAR")}</Button>
          </ButtonToolbar>
        </PageContent>
      </div>
    );
  }
}

BuildPage.propTypes = {
  profile: PropTypes.bool.isRequired,
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
  clearConsole: PropTypes.func.isRequired,
  deleteBuildCache: PropTypes.func.isRequired,
  setProfiling: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    status: state.console.status,
    output: state.console.output,
    warnings: state.console.warnings,
    profile: state.editor.profile
  };
}

const mapDispatchToProps = {
  clearConsole: consoleActions.clearConsole,
  buildGame: buildGameActions.buildGame,
  deleteBuildCache: buildGameActions.deleteBuildCache,
  setProfiling: editorActions.setProfiling,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BuildPage);
