import { VariableSelectWrapper } from "components/forms/VariableSelect";
import styled from "styled-components";
import { InputGroupPrepend } from "ui/form/InputGroup";
import { StyledInput } from "ui/form/style";

export const VariableIndexBracket = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.input.text};
`;

export const VariableIndexInputGroup = styled.div`
  display: flex;
  width: auto;
  min-width: min-content;
  flex: 1 1 160px;

  > ${InputGroupPrepend} + * .CustomSelect__control,
  > ${InputGroupPrepend} + * ${StyledInput} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

export const IndexedVariableInputGroup = styled.div`
  display: flex;
  width: 100%;
  min-width: 200px;

  > ${InputGroupPrepend} + ${VariableSelectWrapper} .CustomSelect__control {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  > ${VariableSelectWrapper} {
    width: auto;
    flex: 3 1 160px;
  }

  > ${VariableIndexInputGroup} {
    flex: 2 1 160px;
  }
`;
