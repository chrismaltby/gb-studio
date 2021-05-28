import React from "react";
import styled from "styled-components";
import { TriangleIcon } from "../icons/Icons";
import { FlatListItem } from "./FlatList";

export interface CollapsibleRowProps {
  item: FlatListItem;
}

const CollapseButton = styled.span`
  color: ${(props) => props.theme.colors.text};
  margin-right: 5px;
  svg {
    width: 8px;
    height: 8px;
    transform: rotate(90deg);
    fill: ${(props) => props.theme.colors.text};
  }
`;

export const CollapsibleRow: React.FC<CollapsibleRowProps> = ({ item }) => {
  return (
    <>
      <CollapseButton>
        <TriangleIcon />
      </CollapseButton>
      {item.name}
    </>
  );
};
