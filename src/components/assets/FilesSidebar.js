import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import { PlusIcon } from "../library/Icons";
import Button from "../library/Button";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";

class FilesSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: ""
    };
  }

  onSearch = e => {
    this.props.onSearch(e.currentTarget.value);
  };

  render() {
    const { files, selectedFile, setNavigationId, onAdd, query } = this.props;

    return (
      <div className="FilesSidebar">
        <div className="FilesSidebar__Search">
          <input
            autoFocus
            placeholder={l10n("ASSET_SEARCH")}
            onChange={this.onSearch}
            value={query}
          />
          {onAdd && (
            <Button onClick={onAdd} title={l10n("ASSET_ADD")}>
              <PlusIcon />
            </Button>
          )}
        </div>
        {files.map((file, index) => (
          <div
            key={file.id}
            onClick={() => setNavigationId(file.id)}
            className={cx("FilesSidebar__ListItem", {
              "FilesSidebar__ListItem--Active": file.id === selectedFile.id
            })}
          >
            {file.name}
          </div>
        ))}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {};
}

const mapDispatchToProps = {
  setNavigationId: actions.setNavigationId
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilesSidebar);
