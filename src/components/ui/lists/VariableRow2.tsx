import React from "react";
import styled from "styled-components";
import { ListItemButton } from "../buttons/ListItemButton";
import { PencilIcon } from "../icons/Icons";
import { FlatListItem } from "./FlatList";

export interface VariableRowProps {
  item: FlatListItem;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;

  ${ListItemButton} {
    opacity: 0;
  }

  :hover ${ListItemButton} {
    opacity: 1;
  }
`;

export const VariableRow: React.FC<VariableRowProps> = ({ item }) => {
  return (
    <Wrapper>
      <div style={{ flexGrow: 1 }}>
        <span style={{ color: "#999" }}>$00$</span> {item.name}
      </div>
      <ListItemButton
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <PencilIcon />
      </ListItemButton>
    </Wrapper>
  );
};
