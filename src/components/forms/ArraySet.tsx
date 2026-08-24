import React from "react";
import { useAppSelector } from "store/hooks";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { ScriptValue } from "shared/lib/scriptValue/types";
import ValueSelect from "components/forms/ValueSelect";
import { VariableIndexBracket } from "components/forms/VariableIndexInput";
import styled from "styled-components";

interface ArraySetProps {
  name: string;
  variableId: string;
  value: ScriptValue[];
  entityId: string;
  onChange: (newValue: ScriptValue[]) => void;
}

export const VariableIndexInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ArrayValueRow = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  gap: 10px;

  & > * {
    margin-bottom: 10px;
  }
`;

const VariableBracketContainer = styled.div`
  display: flex;
  flex: 0 1;
  flex-direction: row;
  height: 20px;
  align-items: center;
`;

export const ArraySet = ({
  name,
  variableId,
  value,
  entityId,
  onChange,
}: ArraySetProps) => {
  const variableIsLocal = variableId && variableId.startsWith("L");
  const variableIsParam = variableId && variableId.startsWith("V");

  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );

  const variable = useAppSelector((state) => {
    let id = variableId;
    if (variableIsLocal) {
      id = `${entityId}__${variableId}`;
    }
    return variableSelectors.selectById(state, id);
  });

  let arrayLength = 1;
  if (
    variableIsParam &&
    customEvent.variables[variableId]?.passByReference === "array"
  ) {
    arrayLength = customEvent.variables[variableId].length;
  } else if (variable?.type === "array") {
    arrayLength = variable.length;
  }

  const onChangeValue = (i: number) => (newValue: ScriptValue) => {
    const newValues = Array.from(
      { length: arrayLength },
      (_, index) => value[index] ?? { type: "number", value: 0 },
    );
    newValues[i] = newValue;
    onChange(newValues);
  };

  return (
    <VariableIndexInputGroup>
      {Array.from({ length: arrayLength }, (_, i) => (
        <ArrayValueRow key={i}>
          <VariableBracketContainer>
            <VariableIndexBracket $type="open" />
            <div>{i}</div>
            <VariableIndexBracket $type="close" />
          </VariableBracketContainer>
          <ValueSelect
            name={`${name}_${variableId}_${i}_value`}
            entityId={entityId}
            value={value[i] ?? { type: "number", value: 0 }}
            onChange={onChangeValue(i)}
            innerValue
          />
        </ArrayValueRow>
      ))}
    </VariableIndexInputGroup>
  );
};
