import React, { ReactNode, useState } from "react";
import styled, { css, keyframes } from "styled-components";

const colorAnimation = keyframes`
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0% 0;
  }
`;

const Wrapper = styled.span<{ $animate: boolean }>`
  background-size: 400% 100%;
  background-image: linear-gradient(
    100deg,
    ${(props) => props.theme.colors.card.text} 0%,
    ${(props) => props.theme.colors.card.text} 45%,
    rgba(255, 0, 0, 1) 50%,
    rgba(255, 154, 0, 1) 52.5%,
    rgba(208, 222, 33, 1) 55%,
    rgba(79, 220, 74, 1) 57.5%,
    rgba(63, 218, 216, 1) 60%,
    rgba(47, 201, 226, 1) 62.5%,
    rgba(28, 127, 238, 1) 65%,
    rgba(95, 21, 242, 1) 67.5%,
    rgba(186, 12, 248, 1) 70%,
    rgba(251, 7, 217, 1) 72.5%,
    rgba(255, 0, 0, 1) 75%,
    ${(props) => props.theme.colors.card.text} 80%,
    ${(props) => props.theme.colors.card.text} 100%
  );
  background-repeat: no-repeat;
  background-position: 0% 0;
  -webkit-background-clip: text;
  color: transparent;

  ${(props) =>
    props.$animate
      ? css`
          animation: ${colorAnimation} 1s linear;
        `
      : ""}
`;

interface ColorAnimationTextProps {
  children: ReactNode;
}

export const ColorAnimationText = ({ children }: ColorAnimationTextProps) => {
  const [animate, setAnimate] = useState(false);
  return (
    <Wrapper
      onClick={() => setAnimate(!animate)}
      onAnimationEnd={() => setAnimate(false)}
      $animate={animate}
    >
      {children}
    </Wrapper>
  );
};
