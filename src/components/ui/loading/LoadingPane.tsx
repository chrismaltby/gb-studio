import React from "react";
import styled, { keyframes } from "styled-components";
import l10n from "shared/lib/lang/l10n";

const fadeIn = keyframes`
from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Wrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  animation: ${fadeIn} 1s normal forwards;
  animation-delay: 0.5s;
`;

const LoadingPane = () => <Wrapper>{l10n("FIELD_LOADING")}</Wrapper>;

export default LoadingPane;
