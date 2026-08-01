import React from "react";
import ToggleButtons from "components/ui/form/ToggleButtons";
import { useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";

type JoypadPickerProps = {
  id: string;
  value: number;
  onChange: (newValue: number) => void;
};

const JoypadPicker = ({ id, value, onChange }: JoypadPickerProps) => {
  const sgbMaxJoypads = useAppSelector(
    (state) => state.project.present.settings.sgbMaxJoypads,
  );

  const options: [number, string, string?][] = [
    [0, "1", l10n("FIELD_JOYPAD_N", { joypad: 1 })],
    [1, "2", l10n("FIELD_JOYPAD_N", { joypad: 2 })],
    [2, "3", l10n("FIELD_JOYPAD_N", { joypad: 3 })],
    [3, "4", l10n("FIELD_JOYPAD_N", { joypad: 4 })],
  ];

  return (
    <ToggleButtons
      name={id}
      options={options.slice(0, sgbMaxJoypads)}
      allowMultiple={false}
      allowNone={false}
      value={Math.min(value, sgbMaxJoypads)}
      onChange={onChange}
    />
  );
};

export default JoypadPicker;
