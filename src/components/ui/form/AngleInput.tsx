import React, { FC } from "react";
import styled from "styled-components";
import { Input } from "./Input";
import { AngleIcon } from "ui/icons/Icons";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled(Input)`
  padding-left: 32px;
`;

interface LabelProps {
  angle: number;
}

const Label = styled.label<LabelProps>`
  position: absolute;
  top: 1px;
  left: 0px;
  bottom: 1px;
  width: 27px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: bold;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  border-right: 1px solid ${(props) => props.theme.colors.input.border};

  svg {
    display: inline-block;
    width: 18px;
    height: 18px;
    fill: ${(props) => props.theme.colors.text};
  }
`;

const Icon = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
`;

const DegreesWrapper = styled.div`
  padding-left: 32px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 1px;
  display: flex;
  align-items: center;
  pointer-events: none;
  opacity: 0.5;
  font-size: 9px;
`;

const HiddenInput = styled.div`
  opacity: 0;
  font-size: 11px;
  padding: 5px;
  padding-right: 5px;
  box-sizing: border-box;
  pointer-events: none;
  margin-right: 0px;
`;

export const AngleInput: FC<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
> = ({ ref: _ref, value, placeholder, id, ...props }) => {
  const degrees = Math.ceil((((Number(value) ?? 0) + 256) / 256) * 360) % 360;

  return (
    <Wrapper>
      <StyledInput
        type="number"
        name={id}
        id={id}
        value={value || ""}
        placeholder={placeholder}
        {...props}
      />

      <DegreesWrapper>
        <HiddenInput>{value || ""}</HiddenInput>
        <span>{degrees}º</span>
      </DegreesWrapper>
      <Label htmlFor={id} angle={degrees} title={`${degrees}º`}>
        <Icon
          style={{
            transform: `rotate(${degrees}deg)`,
          }}
        >
          <AngleIcon />
        </Icon>
      </Label>
    </Wrapper>
  );
};

AngleInput.defaultProps = {
  value: undefined,
};
