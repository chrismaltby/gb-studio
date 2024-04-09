import React, { useCallback } from "react";
import styled from "styled-components";

export type ToggleButtonGroupOption<T> = {
  value: T;
  label: string | React.ReactNode;
  title?: string;
};

export type ToggleButtonGroupProps<T> = {
  name: string;
  options: ToggleButtonGroupOption<T>[];
} & (
  | {
      multiple: true;
      value: T[];
      onChange: (newValue: T[]) => void;
    }
  | {
      multiple?: false;
      value: T;
      onChange: (newValue: T) => void;
    }
);

export const ToggleButtonGroupWrapper = styled.div`
  display: flex;
  position: relative;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: 4px;
  box-sizing: border-box;
  width: 100%;
  height: 28px;

  & > * {
    box-sizing: border-box;
    border-right: 1px solid ${(props) => props.theme.colors.input.border};
  }

  & > *:last-child {
    border-right: 0px;
  }
`;

const Option = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
`;

const Label = styled.label`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 5px;
  position: relative;
  border: 1px solid transparent;

  ${Option}:first-child > & {
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
  }

  ${Option}:last-child > & {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
  }

  ${Option}:hover > & {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  ${Option}:focus > & {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
  }

  ${Input}:checked + & {
    color: #fff;
    background: ${(props) => props.theme.colors.highlight};
    z-index: 1;
  }

  ${Input}:focus + & {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight};
  }

  svg {
    width: 8px;
    height: 8px;
    fill: ${(props) => props.theme.colors.input.text};
  }

  ${Input}:checked + & svg {
    fill: #fff;
  }
`;

export const ToggleButtonGroup = <T,>({
  name,
  options,
  ...props
}: ToggleButtonGroupProps<T>) => {
  const onChange = useCallback(
    (value: T) => {
      if (props.multiple) {
        if (props.value.includes(value)) {
          props.onChange(props.value.filter((i) => i !== value));
        } else {
          props.onChange(([] as T[]).concat(props.value, value));
        }
      } else {
        props.onChange(value);
      }
    },
    [props]
  );
  return (
    <ToggleButtonGroupWrapper>
      {options.map((option) => (
        <Option key={String(option.value)}>
          <Input
            id={`${name}__${option.value}`}
            type={props.multiple ? "checkbox" : "radio"}
            name={name}
            checked={
              props.multiple
                ? props.value.includes(option.value)
                : option.value === props.value
            }
            onChange={() => onChange(option.value)}
          />
          <Label htmlFor={`${name}__${option.value}`} title={option.title}>
            {option.label}
          </Label>
        </Option>
      ))}
    </ToggleButtonGroupWrapper>
  );
};
