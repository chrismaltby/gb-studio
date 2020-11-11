import React, { Component, FC } from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";
import { ActorSpriteType } from "../../store/features/entities/entitiesTypes";
import { Option, Select } from "../ui/form/Select";

interface SpriteTypeSelectProps {
  name: string;
  value?: ActorSpriteType;
  onChange?: (newValue: ActorSpriteType) => void;
}

interface SpriteTypeOption {
  value: ActorSpriteType;
  label: string;
}

const options: SpriteTypeOption[] = [
  { value: "static", label: l10n("FIELD_MOVEMENT_STATIC") },
  { value: "actor", label: l10n("ACTOR") },
];

export const SpriteTypeSelect: FC<SpriteTypeSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const currentValue = options.find((o) => o.value === value);
  return (
    <div>
      <Select
        id={name}
        value={currentValue}
        options={options}
        onChange={(newValue: SpriteTypeOption) => {
          onChange?.(newValue.value);
        }}
      />
    </div>
  );
};

// class SpriteTypeSelect extends Component {
//   render() {
//     const { id, value, onChange } = this.props;
//     return (
//       <select id={id} value={value} onChange={onChange}>
//         <option value="static">{l10n("FIELD_MOVEMENT_STATIC")}</option>
//         <option value="actor">
//           {l10n("ACTOR")}
//         </option>
//       </select>
//     );
//   }
// }

// SpriteTypeSelect.propTypes = {
//   id: PropTypes.string,
//   value: PropTypes.string,
//   onChange: PropTypes.func.isRequired
// };

// SpriteTypeSelect.defaultProps = {
//   id: undefined,
//   value: "static"
// };

// export default SpriteTypeSelect;
