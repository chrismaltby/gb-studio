import React, { ReactElement, useRef } from "react";
import styled from "styled-components";
import useOnScreen from "ui/hooks/use-on-screen";

export const SkeletonInput = styled.div`
  background: ${(props) => props.theme.colors.input.background};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;
  height: 28px;
  opacity: 0.3;
`;

interface OffscreenSkeletonInputProps {
  children: ReactElement;
}

export const OffscreenSkeletonInput = ({
  children,
}: OffscreenSkeletonInputProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  return <div ref={ref}>{isVisible ? children : <SkeletonInput />}</div>;
};
