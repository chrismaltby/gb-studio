import React, { useMemo } from "react";
import { TriangleIcon } from "ui/icons/Icons";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { ToggleButtonGroup } from "ui/form/ToggleButtonGroup";

type InputPickerProps = {
  id: string;
  autoFocus?: boolean;
} & (
  | {
      multiple: true;
      value: string[];
      onChange: (newValue: string[]) => void;
    }
  | {
      multiple?: false;
      value: string;
      onChange: (newValue: string) => void;
    }
);

interface InputOption {
  value: string;
  name: string;
  label: React.ReactNode;
  title: string;
}

const RotateLeft = styled.div`
  svg {
    transform: rotate(-90deg);
  }
`;

const RotateRight = styled.div`
  svg {
    transform: rotate(90deg);
  }
`;

const RotateDown = styled.div`
  svg {
    transform: rotate(180deg);
  }
`;

const InputPicker = ({ id, ...props }: InputPickerProps) => {
  const options = useMemo(
    () =>
      [
        {
          value: "left",
          name: "Left",
          label: (
            <RotateLeft>
              <TriangleIcon />
            </RotateLeft>
          ),
          title: l10n("FIELD_DIRECTION_LEFT"),
        },
        {
          value: "up",
          name: "Up",
          label: <TriangleIcon />,
          title: l10n("FIELD_DIRECTION_UP"),
        },
        {
          value: "down",
          name: "Down",
          label: (
            <RotateDown>
              <TriangleIcon />
            </RotateDown>
          ),
          title: l10n("FIELD_DIRECTION_DOWN"),
        },
        {
          value: "right",
          name: "Right",
          label: (
            <RotateRight>
              <TriangleIcon />
            </RotateRight>
          ),
          title: l10n("FIELD_DIRECTION_RIGHT"),
        },
        {
          value: "a",
          name: "A",
          label: "A",
          title: "A",
        },
        {
          value: "b",
          name: "B",
          label: "B",
          title: "B",
        },
        {
          value: "start",
          name: "Start",
          label: "Start",
          title: "Start",
        },
        {
          value: "select",
          name: "Select",
          label: "Select",
          title: "Select",
        },
      ] as InputOption[],
    []
  );
  return <ToggleButtonGroup name={id} options={options} {...props} />;
};

export default InputPicker;
