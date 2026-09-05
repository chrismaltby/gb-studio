import React, { useCallback, useLayoutEffect, useRef } from "react";
import styled, { css } from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import editorActions from "store/features/editor/editorActions";
import { ConsoleLink } from "store/features/console/consoleState";
import { ResourceLinkedText } from "ui/links/ResourceLinkedText";
import { DebuggerBuildFooter } from "components/debugger/DebuggerBuildFooter";

const PIN_TO_BOTTOM_RANGE = 100;

const isNearBottom = (el: HTMLDivElement) =>
  el.scrollTop >= el.scrollHeight - el.clientHeight - PIN_TO_BOTTOM_RANGE;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
  font-size: 11px;
`;

const Terminal = styled.div`
  flex-grow: 1;
  background: #111;
  color: #fff;
  padding: 10px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow: auto;
  user-select: text;
`;

interface LogLineProps {
  $type: "log" | "warn";
}

const LogLine = styled.div<LogLineProps>`
  color: white;
  ${(props) =>
    props.$type === "warn"
      ? css`
          color: orange;
        `
      : ""};
`;

const LogLink = styled.a`
  cursor: pointer;
`;

interface BuildLogLineProps {
  text: string;
  link?: ConsoleLink;
  type: "log" | "warn";
}

const BuildLogLine = ({ text, type, link }: BuildLogLineProps) => {
  const dispatch = useAppDispatch();
  return (
    <LogLine $type={type}>
      <ResourceLinkedText text={text} />
      {link && (
        <LogLink
          onClick={() => {
            if (link.type === "customEvent") {
              dispatch(
                editorActions.openEditorResourceById({
                  type: "customEvent",
                  customEventId: link.entityId,
                }),
              );
            } else if (link.type === "actor") {
              dispatch(
                editorActions.openEditorResourceById({
                  type: "actor",
                  actorId: link.entityId,
                  sceneId: link.sceneId,
                }),
              );
            } else if (link.type === "trigger") {
              dispatch(
                editorActions.openEditorResourceById({
                  type: "trigger",
                  triggerId: link.entityId,
                  sceneId: link.sceneId,
                }),
              );
            } else if (link.type === "scene") {
              dispatch(
                editorActions.openEditorResourceById({
                  type: "scene",
                  sceneId: link.sceneId,
                }),
              );
            }
          }}
        >
          ➡️ <u>{link.linkText}</u>
        </LogLink>
      )}
    </LogLine>
  );
};

const DebuggerBuildLog = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldPinToBottomRef = useRef(true);

  const output = useAppSelector((state) => state.console.output);
  const warnings = useAppSelector((state) => state.console.warnings);
  const status = useAppSelector((state) => state.console.status);
  // Only show the latest 500 lines during build
  // show full output on complete
  const outputLines = status === "complete" ? output : output.slice(-500);

  const onScroll = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }
    shouldPinToBottomRef.current = isNearBottom(scrollEl);
  }, []);

  useLayoutEffect(() => {
    // Pin scroll to bottom of console as new lines arrive if currently near bottom of scroll anyway
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    if (shouldPinToBottomRef.current) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [outputLines.length, warnings.length, status]);

  useLayoutEffect(() => {
    // Pin scroll to bottom of console on initial load
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    scrollEl.scrollTop = scrollEl.scrollHeight;
    shouldPinToBottomRef.current = true;
  }, []);

  return (
    <Wrapper>
      <Terminal ref={scrollRef} onScroll={onScroll}>
        {outputLines.map((out, index) => (
          <BuildLogLine
            key={index}
            text={out.text}
            type={out.type === "err" ? "warn" : "log"}
            link={out.link}
          />
        ))}
        {status === "cancelled" && (
          <div style={{ color: "orange" }}>{l10n("BUILD_CANCELLING")}...</div>
        )}
        {status === "complete" && warnings.length > 0 && (
          <div>
            <br />
            Warnings:
            {warnings.map((out, index) => (
              <BuildLogLine
                key={index}
                type="warn"
                text={out.text}
                link={out.link}
              />
            ))}
          </div>
        )}
      </Terminal>
      <DebuggerBuildFooter showClear />
    </Wrapper>
  );
};

export default DebuggerBuildLog;
