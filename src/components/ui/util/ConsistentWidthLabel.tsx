import React from "react";
import styled from "styled-components";

interface ConsistentWidthLabelProps {
  label: string;
  possibleValues: string[];
}

const PossibleValuesWrapper = styled.span`
  max-height: 1px;
  overflow: hidden;
  white-space: pre-wrap;
  visibility: hidden;
  flex-shrink: 0;
`;

const ActualValueWrapper = styled.span`
  position: absolute;
`;

export const ConsistentWidthLabel = ({
  label,
  possibleValues,
}: ConsistentWidthLabelProps) => {
  return (
    <>
      <PossibleValuesWrapper aria-hidden="true">
        {possibleValues.join("\n")}
      </PossibleValuesWrapper>
      <ActualValueWrapper>{label}</ActualValueWrapper>
    </>
  );
};
