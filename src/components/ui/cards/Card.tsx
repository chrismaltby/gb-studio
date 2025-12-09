import styled, { css } from "styled-components";

interface CardProps {
  $indent?: number;
}

export const Card = styled.div<CardProps>`
  background: ${(props) => props.theme.colors.card.background};
  color: ${(props) => props.theme.colors.card.text};
  padding: 20px;
  border: 1px solid ${(props) => props.theme.colors.card.border};
  box-shadow: ${(props) => props.theme.colors.card.boxShadow};
  border-radius: 3px;
  width: 100%;
  box-sizing: border-box;

  ${(props) =>
    props.$indent &&
    css`
      border-left-width: ${props.$indent * 25}px;
    `}
`;

export const CardHeading = styled.h2`
  font-size: 20px;
  margin: 0;
  padding: 0;
  margin-bottom: 15px;
`;

export const CardButtons = styled.div`
  margin-top: 20px;
  display: flex;

  & > *:not(:last-child) {
    margin-right: 10px;
  }
`;

export const CardAnchor = styled.div`
  display: block;
  position: relative;
  top: -41px;
  visibility: hidden;
`;
