import styled from "styled-components";

export const Card = styled.div`
  background: ${(props) => props.theme.colors.card.background};
  color: ${(props) => props.theme.colors.card.text};
  padding: 20px;
  border: 1px solid ${(props) => props.theme.colors.card.border};
  box-shadow: ${(props) => props.theme.colors.card.boxShadow};
  border-radius: 3px;
  width: 100%;
  box-sizing: border-box;
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
