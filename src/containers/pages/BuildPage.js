import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button, { ButtonToolbar } from "../../components/library/Button";
import PageContent from "../../components/library/PageContent";

class BuildPage extends Component {
  render() {
    const { status, output } = this.props;
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto"
        }}
      >
        <div
          style={{
            flexGrow: 1,
            background: "#111",
            color: "#fff",
            padding: 20,
            fontFamily: "monospace"
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
            <Button>Run</Button>
            <Button>Export ROM</Button>
            <Button>Export Web</Button>
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
  editActor: actions.editActor,
  editTrigger: actions.editTrigger
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BuildPage);
