import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import uniq from "lodash/uniq";
import { RootState } from "store/configureStore";
import { spriteStateSelectors } from "store/features/entities/entitiesState";
import {
  CreatableSelect,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import l10n from "lib/helpers/l10n";

interface AnimationStateSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  creatable?: boolean;
  allowDefault?: boolean;
  onChange?: (newId: string) => void;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const AnimationStateSelect = ({
  name,
  value,
  creatable,
  allowDefault,
  onChange,
}: AnimationStateSelectProps) => {
  const [options, setOptions] = useState<Option[]>([]);
  const spriteStates = useSelector((state: RootState) =>
    spriteStateSelectors.selectAll(state)
  );

  useEffect(() => {
    const options = ([] as Option[]).concat(
      allowDefault
        ? {
            value: "",
            label: l10n("FIELD_DEFAULT"),
          }
        : [],
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

    setOptions(options);
  }, [spriteStates]);

  const Element = creatable ? CreatableSelect : Select;

  return (
    <Element
      name={name}
      value={{
        value,
        label: value || (allowDefault ? l10n("FIELD_DEFAULT") : ""),
      }}
      onChange={(e: Option) => {
        onChange?.(e.value);
      }}
      options={options}
    />
  );
};

export default AnimationStateSelect;
