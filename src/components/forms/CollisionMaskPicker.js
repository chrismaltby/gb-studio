import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import l10n from "lib/helpers/l10n";

class CollisionMaskPicker extends Component {
  render() {
    const { id, value, includePlayer, includeNone, onChange } = this.props;
    const directions = [].concat(
      includePlayer
        ? [
            {
              key: "player",
              name: "Player",
              title: l10n("FIELD_PLAYER"),
            },
          ]
        : [],
      [
        {
          key: "1",
          name: "1",
          title: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
        },
        {
          key: "2",
          name: "2",
          title: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
        },
        {
          key: "3",
          name: "3",
          title: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
        },
      ]
    );

    return (
      <div className="CollisionMaskPicker">
        {includeNone && (
          <label htmlFor={`${id}_none`} title={l10n("FIELD_NONE")}>
            <input
              id={`${id}_none`}
              type="checkbox"
              checked={Array.isArray(value) ? value.length === 0 : !value}
              onChange={() => {
                if (Array.isArray(value)) {
                  onChange([]);
                } else {
                  onChange(undefined);
                }
              }}
            />
            <div
              className={cx("CollisionMaskPicker__Button", {
                "CollisionMaskPicker__Button--Active": Array.isArray(value)
                  ? value.length === 0
                  : !value,
              })}
            >
              {l10n("FIELD_NONE")}
            </div>
          </label>
        )}
        {directions.map((direction, index) => (
          <label
            htmlFor={`${id}_${index}`}
            key={direction.key}
            title={direction.title}
          >
            <input
              id={`${id}_${index}`}
              type="checkbox"
              checked={
                Array.isArray(value)
                  ? value.indexOf && value.indexOf(direction.key) > -1
                  : value === direction.key
              }
              onChange={() => {
                if (Array.isArray(value)) {
                  if (value.indexOf(direction.key) > -1) {
                    onChange(value.filter((i) => i !== direction.key));
                  } else {
                    onChange([].concat(value, direction.key));
                  }
                } else {
                  onChange(direction.key);
                }
              }}
            />
            <div
              className={cx(
                "CollisionMaskPicker__Button",
                `CollisionMaskPicker__Button--${direction.name}`,
                {
                  "CollisionMaskPicker__Button--Active": Array.isArray(value)
                    ? value.indexOf && value.indexOf(direction.key) > -1
                    : value === direction.key,
                }
              )}
            >
              {direction.name}
            </div>
          </label>
        ))}
      </div>
    );
  }
}

CollisionMaskPicker.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  includePlayer: PropTypes.bool,
  includeNone: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

CollisionMaskPicker.defaultProps = {
  id: undefined,
  value: "",
  includePlayer: false,
  includeNone: false,
};

export default CollisionMaskPicker;
