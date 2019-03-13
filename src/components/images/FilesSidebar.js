import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import { PlusIcon } from "../library/Icons";
import Button from "../library/Button";
import * as actions from "../../actions";

class FilesSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: ""
    };
  }

  onSearch = e => {
    this.setState({
      query: e.currentTarget.value
    });
  };

  render() {
    const { files, id, setNavigationId, onAdd } = this.props;
    const { query } = this.state;
    const filesList = query
      ? files.filter(file => {
          return file.name.toUpperCase().indexOf(query.toUpperCase()) > -1;
        })
      : files;

    return (
      <div className="FilesSidebar">
        <div className="FilesSidebar__Search">
          <input
            autoFocus
            placeholder="Search..."
            onChange={this.onSearch}
            value={query}
          />
          {onAdd && (
            <Button onClick={onAdd}>
              <PlusIcon />
            </Button>
          )}
        </div>
        {filesList.map((file, index) => (
          <div
            key={file.id}
            onClick={() => setNavigationId(file.id)}
            className={cx("FilesSidebar__ListItem", {
              "FilesSidebar__ListItem--Active": id
                ? file.id === id
                : index === 0
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
  return {
    id: state.navigation.id
  };
}

const mapDispatchToProps = {
  setNavigationId: actions.setNavigationId
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilesSidebar);
