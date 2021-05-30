import React from "react";
import styled from "styled-components";
import { FlatListItem } from "./FlatList";

export interface VariableRowProps {
  item: FlatListItem;
}

const VarId = styled.span`
  color: #999;
  margin-right: 5px;
`;

export const VariableRow: React.FC<VariableRowProps> = ({ item }) => {
  return (
    <>
      <VarId>${String(item.id).padStart(2, "0")}$</VarId>
      {item.name}
    </>
  );
};
