import React from "react";
import styled from "styled-components";
import { UploadIcon } from "../icons/Icons";

export const DropZone = styled.div.attrs((_props) => ({
  children: <UploadIcon />,
}))`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  svg {
    fill: #fff;
    width: 100px;
    height: 100px;
  }
`;
