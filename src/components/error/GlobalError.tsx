import React, { useCallback, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import { SadIcon } from "ui/icons/Icons";
import electronActions from "store/features/electron/electronActions";
import { Button } from "ui/buttons/Button";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";

const Wrapper = styled.div`
  display: flex;
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
`;

const Content = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  -webkit-app-region: none;
`;

const Icon = styled.div`
  width: 192px;
  height: 192px;
  svg {
    width: 100%;
    height: 100%;
  }
`;

const Buttons = styled.div`
  > * {
    margin: 20px 10px;
  }
`;

const StackTrace = styled.div`
  background: #fff;
  color: #000;
  padding: 30px;
  border-radius: 4px;
  height: 270px;
  margin-top: 20px;
  max-width: 860px;
  overflow: auto;
  user-select: text;
`;

const GlobalError = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.error);
  const [viewTrace, setViewTrace] = useState(false);

  const toggleTrace = useCallback(() => {
    setViewTrace(!viewTrace);
  }, [viewTrace]);

  const openHelp = useCallback(() => {
    dispatch(electronActions.openHelp("error"));
  }, [dispatch]);

  const { message, filename, line, col, stackTrace } = error;

  if (viewTrace) {
    return (
      <Wrapper>
        <Content>
          <h2>{message}</h2>
          {filename && (
            <p>
              {filename}
              {line && `:L${line}`}
              {col && `C:${col}`}
            </p>
          )}
          <StackTrace>
            {stackTrace.split("\n").map((line) => (
              <div>{line}</div>
            ))}
          </StackTrace>
          <Buttons>
            <Button onClick={toggleTrace}>{l10n("ERROR_CLOSE")}</Button>
          </Buttons>
        </Content>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Content>
        <Icon>
          <SadIcon />
        </Icon>
        <h1>{l10n("ERROR_TITLE")}</h1>
        <h2>{message}</h2>
        {filename && (
          <p>
            {filename}
            {line && `:L${line}`}
            {col && `C:${col}`}
          </p>
        )}
        <Buttons>
          <Button onClick={openHelp}>{l10n("ERROR_WHAT_CAN_I_DO")}</Button>
          <Button onClick={toggleTrace}>
            {l10n("ERROR_VIEW_STACK_TRACE")}
          </Button>
        </Buttons>
      </Content>
    </Wrapper>
  );
};

export default GlobalError;
