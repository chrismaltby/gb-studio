import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import uniq from "lodash/uniq";
import { RootState } from "store/configureStore";
import { spriteStateSelectors } from "store/features/entities/entitiesState";
import { CreatableSelect, Option, SelectCommonProps } from "ui/form/Select";

interface AnimationStateSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const AnimationStateSelect = ({
  name,
  value,
  onChange,
}: AnimationStateSelectProps) => {
  const [options, setOptions] = useState<Option[]>([]);
  const spriteStates = useSelector((state: RootState) =>
    spriteStateSelectors.selectAll(state)
  );

  useEffect(() => {
    setOptions(
      uniq(
        spriteStates
          .map((state) => state.name)
          .filter((i) => i)
          .sort(collator.compare)
      ).map((state) => ({
        value: state,
        label: state,
      }))
    );
  }, [spriteStates]);

  return (
    <CreatableSelect
      name={name}
      value={{
        value,
        label: value,
      }}
      onChange={(e: Option) => {
        onChange?.(e.value);
      }}
      options={options}
    />
  );
};

export default AnimationStateSelect;
