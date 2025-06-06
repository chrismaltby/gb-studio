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

const escapeRegExpString = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const HighlightWords = ({ text, words }: HighlightWordsProps) => {
  if (!words.length) {
    return <>{text}</>;
  }

  const escapeWords = words.map(escapeRegExpString);

  const regex = new RegExp(`(${escapeWords.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <Wrapper>
      {parts.map((part, index) => {
        if (
          escapeWords.some((word) =>
            new RegExp(`\\b${word}\\b`, "i").test(part),
          )
        ) {
          return <span key={index}>{part}</span>;
        }
        return part;
      })}
    </Wrapper>
  );
};
