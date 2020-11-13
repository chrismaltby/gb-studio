import styled from "styled-components";

export const ListItemButton = styled.button`
  display: flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  border: 0;
  padding: 0;
  background-color: transparent;

  :hover {
    background-color: #ccc;
    border-radius: 4px;
  }

  svg {
    display: block;
    width: 10px;
    height: 10px;
    fill: #666;
  }
`;
