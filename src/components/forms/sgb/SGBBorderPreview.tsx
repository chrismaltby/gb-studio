import React, { useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";

interface SGBBorderPreviewProps {
  onClick?: () => void;
}

const SGBBorderPreviewButton = styled.button`
  position: relative;
  width: 128px;
  height: 112px;
  background-size: cover;
  background-color: #ccc;
  border-radius: 4px;
  border: 0px;
  display: block;
  padding: 0;

  :hover:after {
    content: "";
    display: block;
    width: 128px;
    height: 112px;
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
  }

  img {
    display: block;
    width: 128px;
    height: 112px;
    border-radius: 4px;
  }
`;

const SGBBorderError = styled.div`
  font-size: 12px;
`;

export const SGBBorderPreview = ({ onClick }: SGBBorderPreviewProps) => {
  const [error, setError] = useState(false);
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const uiVersion = useSelector((state: RootState) => state.editor.uiVersion);

  if (error) {
    return (
      <SGBBorderError>Image will be created after next build.</SGBBorderError>
    );
  }

  return (
    <SGBBorderPreviewButton onError={() => setError(true)} onClick={onClick}>
      <img
        onError={() => console.log("IMG ERROR")}
        src={`file://${projectRoot}/assets/sgb/border.png?_v=${uiVersion}`}
        alt=""
      />
    </SGBBorderPreviewButton>
  );
};
