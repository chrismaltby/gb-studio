import React from "react";
import styled from "styled-components";

interface HighlightWordsProps {
  text: string;
  words: string[];
}

const Wrapper = styled.span`
  white-space: pre;
  span {
    color: ${(props) => props.theme.colors.highlight};
  }
`;

export const HighlightWords = ({ text, words }: HighlightWordsProps) => {
  if (!words.length) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <Wrapper>
      {parts.map((part, index) => {
        if (words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(part))) {
          return <span key={index}>{part}</span>;
        }
        return part;
      })}
    </Wrapper>
  );
};
