import React, { useCallback, useMemo, useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-c";
import Prism from "prismjs";
import styled from "styled-components";
import gbvmGrammar from "./prism/gbvm.grammar";
import { useAppSelector } from "store/hooks";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import ScriptEventTitle from "components/script/ScriptEventTitle";
import l10n from "shared/lib/lang/l10n";
import { ScrollTo } from "ui/util/ScrollTo";

interface CodeEditorProps {
  value: string;
  onChange?: (newValue: string) => void;
  currentLineNum?: number;
  language: "gbvm" | "c";
  placeholder?: string;
}

interface CodeViewerProps {
  value: string;
  currentLineNum?: number;
}

interface WrapperProps {
  $gutterWidth: number;
}

const LINE_NO_CHAR_WIDTH = 7;
const LINE_NO_MARGIN = 5;

const Wrapper = styled.div<WrapperProps>`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;

  &:hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  &:focus {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
  }

  &:disabled {
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
    padding-left: ${(props) =>
      props.$gutterWidth * LINE_NO_CHAR_WIDTH + LINE_NO_MARGIN}px !important;
  }

  .editor pre {
    padding-left: ${(props) =>
      props.$gutterWidth * LINE_NO_CHAR_WIDTH + LINE_NO_MARGIN}px !important;
  }

  .preview pre {
    user-select: text;
    margin: 0px;
    border: 0px;
    white-space: pre-wrap;
    word-break: keep-all;
    overflow-wrap: break-word;
    padding-left: ${(props) =>
      props.$gutterWidth * LINE_NO_CHAR_WIDTH + LINE_NO_MARGIN}px;
  }

  .editorLineNumber {
    position: absolute;
    left: 0px;
    color: ${(props) => props.theme.colors.token.code};
    opacity: 0.5;
    text-align: right;
    width: ${(props) => props.$gutterWidth * LINE_NO_CHAR_WIDTH}px;
    font-weight: 100;
    user-select: none;
    white-space: nowrap;
  }

  .currentLine {
    background: ${(props) => props.theme.colors.input.border};
    width: 100%;
    display: inline-block;
  }

  .currentLine .editorLineNumber {
    background: ${(props) => props.theme.colors.highlight};
    color: ${(props) => props.theme.colors.highlightText};
    opacity: 1;
  }
`;

const highlightWithLineNumbers = (
  input: string,
  currentLineNum: number,
  language: "gbvm" | "c",
) => {
  const grammar = language === "gbvm" ? gbvmGrammar : Prism.languages.c;
  const highlighted = highlight(input, grammar, language);
  const lines = highlighted.split("\n");
  const gutterWidth = String(lines.length).length;
  return {
    highlightedCode: lines
      .map(
        (line, i) =>
          `<span class='line-${i + 1}${
            i + 1 === currentLineNum ? " currentLine " : ""
          }'><span class='editorLineNumber'>${i + 1}</span>${line}</span>`,
      )
      .join("\n"),
    gutterWidth,
  };
};

const noop = () => {};

const getCommentPrefix = (language: "gbvm" | "c"): string => {
  return language === "gbvm" ? "; " : "// ";
};

const toggleLineComment = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  language: "gbvm" | "c",
): { newValue: string; newSelectionStart: number; newSelectionEnd: number } => {
  const commentPrefix = getCommentPrefix(language);
  const lines = value.split("\n");

  // Find line indices for selection by counting characters
  let charCount = 0;
  let startLineIndex = -1;
  let endLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineEnd = charCount + lines[i].length; // End of line content (before newline)

    // Check if selection start falls within this line
    if (startLineIndex === -1 && selectionStart <= lineEnd) {
      startLineIndex = i;
    }

    // Check if selection end falls within this line
    if (endLineIndex === -1 && selectionEnd <= lineEnd) {
      endLineIndex = i;
      break;
    }

    charCount = lineEnd + 1; // +1 for the newline character
  }

  // Handle edge cases
  if (startLineIndex === -1) startLineIndex = lines.length - 1;
  if (endLineIndex === -1) endLineIndex = lines.length - 1;

  // Check if all selected lines are commented
  const selectedLines = lines.slice(startLineIndex, endLineIndex + 1);
  const allCommented = selectedLines.every((line) =>
    line.trimStart().startsWith(commentPrefix.trim()),
  );

  let totalDelta = 0;
  let firstLineDelta = 0;

  // Toggle comments
  for (let i = startLineIndex; i <= endLineIndex; i++) {
    const line = lines[i];
    if (allCommented) {
      // Remove comment
      const commentIndex = line.indexOf(commentPrefix.trim());
      if (commentIndex !== -1) {
        // Check if there's a space after the comment prefix
        const hasSpace = line.substring(commentIndex).startsWith(commentPrefix);
        const removeLength = hasSpace
          ? commentPrefix.length
          : commentPrefix.trim().length;
        lines[i] =
          line.substring(0, commentIndex) +
          line.substring(commentIndex + removeLength);
        const delta = -removeLength;
        totalDelta += delta;
        if (i === startLineIndex) {
          firstLineDelta = delta;
        }
      }
    } else {
      // Add comment at the start of the line (preserving indentation)
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : "";
      lines[i] = indent + commentPrefix + line.substring(indent.length);
      const delta = commentPrefix.length;
      totalDelta += delta;
      if (i === startLineIndex) {
        firstLineDelta = delta;
      }
    }
  }

  return {
    newValue: lines.join("\n"),
    newSelectionStart: Math.max(0, selectionStart + firstLineDelta),
    newSelectionEnd: Math.max(0, selectionEnd + totalDelta),
  };
};

export const CodeEditor = ({
  value,
  currentLineNum,
  onChange,
  language,
  placeholder,
}: CodeEditorProps) => {
  const [gutterWidth, setGutterWidth] = useState(3);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();

        // Find the textarea - either the currentTarget is the textarea, or it contains one
        const textarea =
          e.currentTarget instanceof HTMLTextAreaElement
            ? e.currentTarget
            : e.currentTarget.querySelector("textarea");
        if (!textarea) return;

        const { selectionStart, selectionEnd } = textarea;

        const { newValue, newSelectionStart, newSelectionEnd } =
          toggleLineComment(value, selectionStart, selectionEnd, language);

        onChange?.(newValue);

        // Restore selection after React re-render
        requestAnimationFrame(() => {
          textarea.selectionStart = newSelectionStart;
          textarea.selectionEnd = newSelectionEnd;
        });
      }
    },
    [value, language, onChange],
  );

  return (
    <Wrapper $gutterWidth={gutterWidth}>
      <Editor
        className="editor"
        value={value}
        onValueChange={onChange ?? noop}
        onKeyDown={handleKeyDown}
        highlight={(code) => {
          const { highlightedCode, gutterWidth: newGutterWidth } =
            highlightWithLineNumbers(code, currentLineNum ?? -1, language);
          if (newGutterWidth !== gutterWidth) {
            setGutterWidth(newGutterWidth);
          }
          return highlightedCode;
        }}
        padding={0}
        placeholder={placeholder}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 11,
        }}
      />
    </Wrapper>
  );
};

const GBVMLabel = ({ line }: { line: string }) => {
  const scriptEventId = String(line.split("$")[2]).replace(/_/g, "-");
  const scriptEvent = useAppSelector((state) =>
    scriptEventSelectors.selectById(state, scriptEventId),
  );

  if (scriptEvent) {
    return (
      <>
        {"; "}
        <ScriptEventTitle
          command={scriptEvent.command}
          args={scriptEvent.args}
        />
      </>
    );
  }

  if (scriptEventId === "autofade") {
    return (
      <>
        ; {l10n("EVENT_FADE_IN")} ({l10n("FIELD_AUTOMATIC")})
      </>
    );
  }

  return <>; {line}</>;
};

export const CodeViewer = ({ value, currentLineNum }: CodeViewerProps) => {
  const { highlightedCode, gutterWidth } = useMemo(() => {
    const highlighted = highlight(String(value), gbvmGrammar, "gbvm");
    const lines = highlighted.split("\n");
    const gutterWidth = String(lines.length).length;

    return {
      highlightedCode: lines.map((line, i) => {
        let lineEl: JSX.Element | null = (
          <span dangerouslySetInnerHTML={{ __html: line }} />
        );
        if (line.startsWith("GBVM$")) {
          lineEl = <GBVMLabel line={line} />;
        } else if (line.startsWith(".globl GBVM$")) {
          lineEl = <span />;
        } else if (line.startsWith("GBVM") || line.startsWith(".globl GBVM")) {
          return null;
        }

        return (
          <>
            <span
              className={`line-${i + 1}${
                i + 1 === currentLineNum ? " currentLine " : ""
              }`}
            >
              {i + 1 === currentLineNum && <ScrollTo scrollMarginTop={32} />}
              <span className="editorLineNumber">{i + 1}</span>
              {lineEl}
            </span>
            {"\n"}
          </>
        );
      }),
      gutterWidth,
    };
  }, [currentLineNum, value]);

  return (
    <Wrapper $gutterWidth={gutterWidth}>
      <div className="preview">
        <pre
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 11,
          }}
        >
          {highlightedCode}
        </pre>
      </div>
    </Wrapper>
  );
};
