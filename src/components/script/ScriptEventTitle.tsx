import React from "react";
import styled from "styled-components";
import { fadeIn } from "ui/animations/animations";
import { useScriptEventTitle } from "components/script/hooks/useScriptEventTitle";

interface ScriptEventTitleProps {
  command: string;
  args?: Record<string, unknown>;
}

const Wrapper = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  animation: ${fadeIn} 0.1s linear;
`;

const ScriptEventTitle = ({ command, args = {} }: ScriptEventTitleProps) => {
  const label = useScriptEventTitle(command, args, true);
  return <Wrapper>{label}</Wrapper>;
};

export default ScriptEventTitle;
