import React, { useCallback } from "react";
import l10n from "shared/lib/lang/l10n";
import { SadIcon } from "ui/icons/Icons";
import electronActions from "store/features/electron/electronActions";
import { Button } from "ui/buttons/Button";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";
import projectActions from "store/features/project/projectActions";
import API from "renderer/lib/api";
import { FlexGrow } from "ui/spacing/Spacing";

declare const VERSION: string;
declare const COMMITHASH: string;

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  padding: 30px;
  overflow: auto;
  box-sizing: border-box;
  -webkit-app-region: drag;

  h1,
  h2,
  p {
    user-select: text;
  }

  h1 {
    margin-bottom: 0;
  }
`;

const Content = styled.div`
  display: flex;
  width: 100%;
  max-width: 860px;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  -webkit-app-region: none;
`;

const Icon = styled.div`
  width: 96px;
  height: 96px;
  svg {
    width: 100%;
    height: 100%;
  }
`;

const Buttons = styled.div`
  display: flex;
  width: 100%;

  & > *:not(:last-child) {
    margin-right: 5px;
  }
`;

const StackTrace = styled.div`
  background: #fff;
  color: #000;
  padding: 10px;
  border-radius: 4px;
  min-height: 140px;
  max-height: 300px;
  margin-top: 20px;
  overflow: auto;
  user-select: text;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 10px;
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};

  h2 {
    margin-top: 0;
  }
`;

const GlobalError = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.error);

  const modified = useAppSelector((state) => state.document.modified);

  const openHelp = useCallback(() => {
    dispatch(electronActions.openHelp("error"));
  }, [dispatch]);

  const saveProject = useCallback(() => {
    dispatch(projectActions.saveProject());
  }, [dispatch]);

  const { message, filename, line, col, stackTrace } = error;

  const stackTraceLines = error.stackTrace.split("\n");

  const reportIssue = useCallback(() => {
    const owner = "chrismaltby";
    const repo = "gb-studio";
    const issueTitle = encodeURIComponent("Bug report: " + message);
    const issueBody = encodeURIComponent(
      `**Error message**\n\`${message}\`\n\n**Stack trace**\n\`\`\`\n${stackTrace}\n\`\`\`\n\n**Platform**\n- OS: ${API.platform}\n- Version: GB Studio ${VERSION} (${COMMITHASH})\n\n**Additional context**\nAdd any other context about the problem here.\ne.g. What was the last thing you did before the error appeared.\n`,
    );
    const labels = encodeURIComponent("bug");
    const issueUrl = `https://github.com/${owner}/${repo}/issues/new?title=${issueTitle}&body=${issueBody}&labels=${labels}`;
    API.app.openExternal(issueUrl);
  }, [message, stackTrace]);

  return (
    <Wrapper>
      <Content>
        <Icon>
          <SadIcon />
        </Icon>
        <h1>{l10n("ERROR_TITLE")}</h1>
        <p>
          {VERSION} ({COMMITHASH})
        </p>
        <StackTrace>
          <strong>{message}</strong>
          {filename && (
            <p>
              {filename}
              {line && `:L${line}`}
              {col && `C:${col}`}
            </p>
          )}
          {stackTraceLines.map((line) => (
            <div>{line}</div>
          ))}
        </StackTrace>
        <Buttons>
          <Button onClick={openHelp}>{l10n("ERROR_WHAT_CAN_I_DO")}</Button>
          <Button onClick={saveProject} disabled={!modified}>
            {l10n(
              !modified ? "ERROR_NO_UNSAVED_CHANGES" : "ERROR_SAVE_PROJECT",
            )}
          </Button>
          <FlexGrow />
          <Button variant="primary" onClick={reportIssue}>
            {l10n("ERROR_REPORT_ISSUE")}
          </Button>
        </Buttons>
      </Content>
    </Wrapper>
  );
};

export default GlobalError;
