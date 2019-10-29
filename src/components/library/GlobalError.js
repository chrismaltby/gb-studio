import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import Button from "./Button";
import * as actions from "../../actions";
import { ErrorShape } from "../../reducers/stateShape";
import { SadIcon } from "./Icons";

class GlobalError extends Component {
  constructor() {
    super();
    this.state = {
      viewTrace: false
    };
  }

  toggleTrace = () => {
    const { viewTrace } = this.state;
    this.setState({ viewTrace: !viewTrace });
  };

  render() {
    const { error, openHelp } = this.props;
    const { viewTrace } = this.state;

    const { message, filename, line, col, stackTrace } = error;

    if (viewTrace) {
      return (
        <div className="GlobalError">
          <div className="GlobalError__Content">
            <h2>{message}</h2>
            {filename && (
              <p>
                {filename}
                {line && `:L${line}`}
                {col && `C:${col}`}
              </p>
            )}
            <div className="GlobalError__StackTrace">
              {stackTrace.split("\n").map(line => (
                <div>{line}</div>
              ))}
            </div>
            <div className="GlobalError__Buttons">
              <Button onClick={this.toggleTrace}>{l10n("ERROR_CLOSE")}</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="GlobalError">
        <div className="GlobalError__Content">
          <div className="GlobalError__Icon">
            <SadIcon />
          </div>
          <h1>{l10n("ERROR_TITLE")}</h1>
          <h2>{message}</h2>
          {filename && (
            <p>
              {filename}
              {line && `:L${line}`}
              {col && `C:${col}`}
            </p>
          )}
          <div className="GlobalError__Buttons">
            <Button onClick={() => openHelp("error")}>
              {l10n("ERROR_WHAT_CAN_I_DO")}
            </Button>
            <Button onClick={this.toggleTrace}>
              {l10n("ERROR_VIEW_STACK_TRACE")}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

GlobalError.propTypes = {
  error: ErrorShape.isRequired,
  openHelp: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
  return {};
}

const mapDispatchToProps = {
  openHelp: actions.openHelp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GlobalError);
