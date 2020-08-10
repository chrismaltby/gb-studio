import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

const Alert = ({ variant, children }) => (
  <div
    className={cx("Alert", {
      "Alert-Warning": variant === "warning",
    })}
  >
    {children}
  </div>
);

const AlertItem = ({ children }) => <div className="AlertItem">{children}</div>;

Alert.propTypes = {
  variant: PropTypes.oneOf(["warning"]),
  children: PropTypes.node,
};

Alert.defaultProps = {
  variant: undefined,
  children: undefined,
};

AlertItem.propTypes = {
  children: PropTypes.node,
};

AlertItem.defaultProps = {
  children: undefined,
};

export default Alert;
export { AlertItem };
