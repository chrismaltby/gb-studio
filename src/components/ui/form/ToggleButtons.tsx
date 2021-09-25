import React, { useCallback } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: 4px;
  box-sizing: border-box;
  width: 100%;
  height: 28px;

  & > * {
    border-right: 1px solid ${(props) => props.theme.colors.input.border};
  }

  & > *:last-child {
    border-right: 0;
  }
`;

const Option = styled.div`
  position: relative;
  width: 100%;
  padding: 5px;

  :hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  :focus {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
  }
`;

const Input = styled.input`
  width: 1px;
  height: 1px;
  opacity: 0;
`;

const Label = styled.label`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: center;
  line-height: 11px;

  ${Option}:first-child > & {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  ${Option}:last-child > & {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  ${Input}:checked + & {
    color: #fff;
    background: ${(props) => props.theme.colors.highlight};
  }

  ${Input}:focus + & {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight};
  }
`;

type ToggleButtonsProps = {
  name: string;
  options: [string, string, string?][];
  allowNone?: boolean;
} & (
  | {
      allowMultiple: true;
      name: string;
      options: [string, string, string?][];
      value: string[];
      onChange: (newValue: string[]) => void;
    }
  | {
      allowMultiple: undefined | false;
      value: string;
      onChange: (newValue: string) => void;
    }
);

const ToggleButtons = (props: ToggleButtonsProps) => {
  const onToggle = useCallback(
    (type: string) => {
      if (props.allowMultiple) {
        if (!Array.isArray(props.value)) {
          props.onChange([type]);
        } else if (props.value.includes(type)) {
          // Remove
          if (props.value.length > 1 || props.allowNone) {
            props.onChange(props.value.filter((v) => v !== type));
          }
        } else {
          props.onChange(([] as string[]).concat(props.value, type));
        }
      } else {
        props.onChange(type);
      }
    },
    [props]
  );

  return (
    <Wrapper>
      {(props.options || []).map(([type, label, title]) => {
        const isChecked =
          props.allowMultiple && Array.isArray(props.value)
            ? props.value.includes(type)
            : props.value === type;
        return (
          <Option key={String(type)}>
            <Input
              id={`${props.name}__${String(type)}`}
              type="checkbox"
              name={props.name}
              checked={isChecked}
              onClick={() => onToggle(type)}
            />
            <Label htmlFor={`${props.name}__${String(type)}`} title={title}>
              {label}
            </Label>
          </Option>
        );
      })}
    </Wrapper>
  );
};

export default ToggleButtons;
