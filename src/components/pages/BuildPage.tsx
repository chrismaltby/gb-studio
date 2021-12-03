import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import l10n from "lib/helpers/l10n";
import editorActions from "store/features/editor/editorActions";
import consoleActions from "store/features/console/consoleActions";
import buildGameActions from "store/features/buildGame/buildGameActions";
import { FixedSpacer, FlexGrow } from "ui/spacing/Spacing";
import { RootState } from "store/configureStore";

const PIN_TO_BOTTOM_RANGE = 100;

const Wrapper = styled.div`
  width: 100%;
  height: calc(100vh - 38px);
  display: flex;
  flex-direction: column;
`;

const Terminal = styled.div`
  flex-grow: 1;
  background: #111;
  color: #fff;
  padding: 20px;
  font-family: monospace;
  white-space: pre-wrap;
  overflow: auto;
  user-select: text;
`;

const ButtonToolbar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20px;

  > * {
    height: 36px;
    line-height: 36px;
  }

  > * ~ * {
    margin-left: 10px;
  }
`;

const BuildPage = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const output = useSelector((state: RootState) => state.console.output);
  const warnings = useSelector((state: RootState) => state.console.warnings);
  const status = useSelector((state: RootState) => state.console.status);
  const profile = useSelector((state: RootState) => state.editor.profile);

  // Only show the latest 500 lines during build
  // show full output on complete
  const outputLines = status === "complete" ? output : output.slice(-500);

  const onBuild = useCallback(
    (type: "rom" | "web") => {
      dispatch(
        buildGameActions.buildGame({
          buildType: type,
          exportBuild: true,
        })
      );
    },
    [dispatch]
  );

  const onDeleteCache = useCallback(() => {
    dispatch(buildGameActions.deleteBuildCache());
  }, [dispatch]);

  const onRun = useCallback(() => {
    dispatch(buildGameActions.buildGame());
  }, [dispatch]);

  const onClear = useCallback(() => {
    dispatch(consoleActions.clearConsole());
  }, [dispatch]);

  const onToggleProfiling = useCallback(() => {
    dispatch(editorActions.setProfiling(!profile));
  }, [dispatch, profile]);

  useEffect(() => {
    // Pin scroll to bottom of console as new lines arrive if currently near bottom of scroll anyway
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      if (
        scrollEl.scrollTop >
        scrollEl.scrollHeight - scrollEl.clientHeight - PIN_TO_BOTTOM_RANGE
      ) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    }
  }, [output]);

  useEffect(() => {
    // Pin scroll to bottom of console on initial load
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, []);

  return (
    <Wrapper>
      <Terminal ref={scrollRef}>
        {outputLines.map((out, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            style={{ color: out.type === "err" ? "orange" : "white" }}
          >
            {out.text}
          </div>
        ))}
        {status === "cancelled" && (
          <div style={{ color: "orange" }}>{l10n("BUILD_CANCELLING")}...</div>
        )}
        {status === "complete" && warnings.length > 0 && (
          <div>
            <br />
            Warnings:
            {warnings.map((out, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} style={{ color: "orange" }}>
                - {out.text}
              </div>
            ))}
          </div>
        )}
      </Terminal>
      <ButtonToolbar>
        {status === "running" ? (
          <Button onClick={onRun}>{l10n("BUILD_CANCEL")}</Button>
        ) : (
          <>
            <Button onClick={onRun}>{l10n("BUILD_RUN")}</Button>
            <FixedSpacer width={10} />
            <Button onClick={() => onBuild("rom")}>
              {l10n("BUILD_EXPORT_ROM")}
            </Button>
            <Button onClick={() => onBuild("web")}>
              {l10n("BUILD_EXPORT_WEB")}
            </Button>
            <Button onClick={onDeleteCache}>
              {l10n("BUILD_EMPTY_BUILD_CACHE")}
            </Button>
            {process.env.NODE_ENV !== "production" && (
              <>
                <FixedSpacer width={10} />
                <label htmlFor="enableProfile">
                  <input
                    id="enableProfile"
                    type="checkbox"
                    checked={profile}
                    onChange={onToggleProfiling}
                  />{" "}
                  Enable BGB Profiling
                </label>
              </>
            )}
          </>
        )}

        <FlexGrow />
        <Button onClick={onClear}>{l10n("BUILD_CLEAR")}</Button>
      </ButtonToolbar>
    </Wrapper>
  );
};

export default BuildPage;
