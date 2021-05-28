import React, { FC, useState } from "react";
import styled, { css, keyframes } from "styled-components";

const colorAnimation = keyframes`
  0% {
    background-position: -200px 0;
  }
  40% {
    background-position: 0 0;
    background-size: 100%;
  }
  60% {
    background-size: 250%;
  }
  80% {
    background-size: 500%;
  }
  100% {
    background-size: 750%;
  }
`;

const Wrapper = styled.span<{ animate: boolean }>`
  {
  ${(props) =>
    props.animate
      ? css`
          background-image: linear-gradient(
            100deg,
            blue 20%,
            green 20%,
            green 40%,
            fuchsia 40%,
            fuchsia 60%,
            red 60%,
            red 80%,
            orange 80%,
            orange 100%
          );
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          color: transparent;
          animation: ${colorAnimation} 2s linear;
        `
      : ""}
`;

export const ColorAnimationText: FC = (props) => {
  const [animate, setAnimate] = useState(false);
  return (
    <Wrapper
      onClick={() => setAnimate(!animate)}
      onAnimationEnd={() => setAnimate(false)}
      animate={animate}
    >
      {props.children}
    </Wrapper>
  );
};
