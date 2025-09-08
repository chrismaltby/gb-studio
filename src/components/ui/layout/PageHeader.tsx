import React, { ReactNode } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${(props) => props.theme.colors.sidebar.background};
  width: 100%;
`;

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  padding: 20px;
  box-sizing: border-box;
`;

interface PageHeaderProps {
  children: ReactNode;
}

export const PageHeader = ({ children }: PageHeaderProps) => {
  return (
    <Wrapper>
      <Container>{children}</Container>
    </Wrapper>
  );
};
