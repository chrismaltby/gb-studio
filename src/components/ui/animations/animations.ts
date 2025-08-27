import { keyframes } from "styled-components";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

export const rotateReverse = keyframes`
  from {
    transform: rotate(360deg);
  }

  to {
    transform: rotate(0deg);
  }
`;

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;
