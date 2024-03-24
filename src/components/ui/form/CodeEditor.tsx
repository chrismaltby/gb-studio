import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, Grammar } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import styled from "styled-components";
import gbvmGrammar from "./prism/gbvm.grammar";

interface CodeEditorProps {
  value: string;
  onChange?: (newValue: string) => void;
  currentLineNum?: number;
}

const Wrapper = styled.div`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;

  :hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  :focus {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
  }

  :disabled {
    opacity: 0.5;
  }

  & > div {
    min-height: 30px;
  }

  code[class*="language-"],
  pre[class*="language-"] {
    background: none;
    font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    line-height: 1.5;

    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;

    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
  }

  .token.comment {
    color: ${(props) => props.theme.colors.token.code};
  }

  .token.boolean,
  .token.number,
  .token.asset {
    color: ${(props) => props.theme.colors.token.character};
  }

  .token.instruction {
    color: ${(props) => props.theme.colors.highlight};
  }

  .token.asset,
  .token.variable {
    color: ${(props) => props.theme.colors.token.variable};
  }

  // Line numbers

  .editor {
    counter-reset: line;
  }

  .editor textarea {
    outline: none;
    padding-left: 30px !important;
  }

  .editor pre {
    padding-left: 30px !important;
  }

  .editor .editorLineNumber {
    position: absolute;
    left: 0px;
    color: ${(props) => props.theme.colors.token.code};
    opacity: 0.5;
    text-align: right;
    width: 25px;
    font-weight: 100;
  }

  .editor .currentLine {
    background: ${(props) => props.theme.colors.input.border};
    width: 100%;
    display: inline-block;
  }

  .editor .currentLine .editorLineNumber {
    background: ${(props) => props.theme.colors.highlight};
    color: ${(props) => props.theme.colors.highlightText};
    opacity: 1;
  }
`;

const hightlightWithLineNumbers = (
  input: string,
  currentLineNum: number,
  language: Grammar
) =>
  highlight(input, language, "gbvm")
    .split("\n")
    .map(
      (line, i) =>
        `<span class='line-${i + 1}${
          i + 1 === currentLineNum ? " currentLine " : ""
        }'><span class='editorLineNumber'>${i + 1}</span>${line}</span>`
    )
    .join("\n");

const noop = () => {};

export const CodeEditor = ({
  value,
  currentLineNum,
  onChange,
}: CodeEditorProps) => {
  return (
    <Wrapper>
      <Editor
        className="editor"
        value={value}
        onValueChange={onChange ?? noop}
        highlight={(code) => {
          return hightlightWithLineNumbers(
            code,
            currentLineNum ?? -1,
            gbvmGrammar
          );
        }}
        padding={0}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 11,
        }}
      />
    </Wrapper>
  );
};
