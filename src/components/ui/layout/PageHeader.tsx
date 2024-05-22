import React from "react";
import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${(props) => props.theme.colors.sidebar.background};
  width: 100%;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  padding: 20px;
  box-sizing: border-box;
`;

export const PageHeader: React.FC = ({ children }) => {
  return (
    <Wrapper>
      <Container>{children}</Container>
    </Wrapper>
  );
};
