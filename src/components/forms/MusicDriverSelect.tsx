import React, { FC, useEffect, useState } from "react";
import { MusicDriverSetting } from "store/features/settings/settingsState";
import { Option, Select, SelectCommonProps } from "ui/form/Select";

interface MusicDriverSelectProps extends SelectCommonProps {
  name: string;
  value?: MusicDriverSetting;
  onChange?: (newId: string) => void;
}

const musicDriverOptions = [
  {
    label: "hUGEDriver",
    value: "huge",
  },
  {
    label: "GBT Player",
    value: "gbt",
  },
];

export const MusicDriverSelect: FC<MusicDriverSelectProps> = ({
  value,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const currentMusicDriver = musicDriverOptions.find(
      (e) => e.value === value
    );
    if (currentMusicDriver) {
      setCurrentValue(currentMusicDriver);
    }
  }, [value]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
  };

  return (
    <Select
      value={currentValue}
      options={musicDriverOptions}
      onChange={onSelectChange}
    />
  );
};
