import styled, { css, keyframes } from "styled-components";
import { StyledButton } from "ui/buttons/style";

const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

const scrollAnim = keyframes`
  from {
    transform: translateY(0px);
  }

  to {
    transform: translateY(-200%);
  }
`;

export const StyledCredits = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  animation: ${fadeIn} 1s linear;
  animation-fill-mode: forwards;
  -webkit-app-region: drag;
  background: red;
`;

export const StyledCreditsTitle = styled.div`
  display: block;
  color: #fff;
  font-size: 40px;
  font-weight: bold;
  text-decoration: none;
  margin-bottom: 80px;
`;

export const StyledCreditsSubHeading = styled.div`
  display: block;
  color: #fff;
  font-size: 30px;
  font-weight: bold;
  text-decoration: none;
  margin-top: 80px;
  margin-bottom: 60px;
`;

interface StyledCreditsPersonProps {
  $gold?: boolean;
}

const goldPersonAnimation = keyframes`
    0%   {background-position: 0px 0px}
    40%  {background-position: 0px 0px}
    60%  {background-position: 200px 0px}
    100% {background-position: 200px 0px}
  `;

export const StyledCreditsPerson = styled.div<StyledCreditsPersonProps>`
  display: block;
  color: #fff;
  font-size: 20px;
  text-decoration: none;
  margin-bottom: 30px;

  ${(props) =>
    props.onClick
      ? css`
          > span:hover {
            color: #ffff00;
            cursor: pointer;
          }
        `
      : ""}

  ${(props) =>
    props.$gold
      ? css`
          font-weight: bold;
          background: linear-gradient(
            to right,
            #ffc107 0px,
            #fff 2px,
            #fff 6px,
            #ffeb3b 8px,
            #ffd08b 200px
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0px 1px 1px #333);
          animation: ${goldPersonAnimation} 2s linear infinite;
        `
      : ""}
`;

interface StyledCreditsContentProps {
  $duration: number;
}

export const StyledCreditsContent = styled.div<StyledCreditsContentProps>`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  animation: ${scrollAnim} ${(props) => props.$duration}s linear infinite;

  &:has(${StyledCreditsPerson} > span:hover) {
    animation-play-state: paused;
  }
`;

export const StyledCreditsCloseButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;

  & > * {
    height: 100%;
  }

  ${StyledButton} {
    padding: 0 5px;
    margin: 0;
  }

  ${StyledButton} svg {
    fill: #fff;
    width: 16px;
    max-width: none;
  }
`;

export const StyledCreditsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  & > * {
    width: 30%;
  }
`;
