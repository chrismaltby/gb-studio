import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import { DotsIcon } from "./components/Icons";

class Splash extends Component {
  constructor() {
    super();
    this.state = {
      blur: false,
      tab: "new"
    };
  }

  componentWillMount() {
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
  }

  componentWillUnmount() {
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("focus", this.onFocus);
  }

  onBlur = () => {
    this.setState({ blur: true });
  };

  onFocus = () => {
    this.setState({ blur: false });
  };

  onSetTab = tab => () => {
    this.setState({ tab });
  };

  render() {
    const { section } = this.props;
    const { blur, tab } = this.state;
    return (
      <div className={cx("Splash", { "Splash--Blur": blur })}>
        <div className="Splash__Tabs">
          <div
            className={cx("Splash__Tab", {
              "Splash__Tab--Active": tab === "new"
            })}
            onClick={this.onSetTab("new")}
          >
            New
          </div>
          <div
            className={cx("Splash__Tab", {
              "Splash__Tab--Active": tab === "recent"
            })}
            onClick={this.onSetTab("recent")}
          >
            Recent
          </div>
          <div className="Splash__FlexSpacer" />
          <div className="Splash__Tab">Open</div>
        </div>

        {tab === "new" ? (
          <div className="Splash__Content">
            <div className="Splash__FormGroup">
              <label>Project name</label>
              <input />
            </div>

            <div className="Splash__FormGroup">
              <label>Target system</label>
              <select>
                <option>HTML</option>
              </select>
            </div>

            <div className="Splash__FormGroup">
              <label>Path</label>
              <input />
              <div className="Splash__InputButton">
                <DotsIcon />
              </div>
              <input
                type="file"
                directory=""
                webkitdirectory=""
                className="Splash__InputButton"
              />
            </div>
            <div className="Splash__FlexSpacer" />

            <div>
              <div className="Splash__Button">Create</div>
            </div>
          </div>
        ) : (
          tab === "recent" && (
            <div className="Splash__Content">Recent: Not implemented</div>
          )
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    section: state.navigation.section
  };
}

export default connect(mapStateToProps)(Splash);
