import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import * as actions from "../../actions";
import Button from "../library/Button";
import CartPreview from "../library/CartPreview";

const cartTypes = [
  {
    type: "1B",
    name: "MBC5+RAM+BATTERY"
  },
  {
    type: "03",
    name: "MBC1+RAM+BATTERY"
  },
  {
    type: "1A",
    name: "MBC5+RAM"
  },
  {
    type: "02",
    name: "MBC1+RAM"
  }
];

class CustomControlsPicker extends Component {
  onChange = cartType => () => {
    const { editProjectSettings } = this.props;
    editProjectSettings({ cartType });
  };

  onRestoreDefault = () => {
    const { editProjectSettings } = this.props;
    editProjectSettings({ cartType: undefined });
  };

  render() {
    const { settings } = this.props;
    return (
      <div className="CartPicker">
        <div className="CartPicker__Options">
          {cartTypes.map(cart => (
            <div
              key={cart.type}
              className="CartPicker__Option"
              onClick={this.onChange(cart.type)}
            >
              <CartPreview
                type={cart.type}
                selected={
                  settings.cartType === cart.type ||
                  (!settings.cartType && cart.type === "1B")
                }
              />
              <div className="CartPicker__OptionLabel">{cart.name}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 30 }}>
          <Button onClick={this.onRestoreDefault}>
            {l10n("FIELD_RESTORE_DEFAULT")}
          </Button>
        </div>
      </div>
    );
  }
}

CustomControlsPicker.propTypes = {
  settings: PropTypes.shape({
    cartType: PropTypes.string
  }).isRequired,
  editProjectSettings: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const project = state.entities.present.result;
  const { settings } = project;
  return {
    settings
  };
}

const mapDispatchToProps = {
  editProjectSettings: actions.editProjectSettings
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomControlsPicker);
