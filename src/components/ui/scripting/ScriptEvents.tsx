import styled, { css } from "styled-components";

export const ScriptEventPlaceholder = styled.div`
  background: ${(props) => props.theme.colors.scripting.placeholder.background};
  height: 25px;
`;

export const ScriptEventRenameInput = styled.input`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  flex-grow: 1;
  border: 0;
  border-radius: 4px;
  padding: 5px;
  margin-left: -5px;
  font-weight: bold;
  margin-right: -22px;
`;

export const ScriptEventRenameInputCompleteButton = styled.button`
  z-index: 10000;
  position: relative;
  top: 0px;
  left: 0px;
  width: 21px;
  height: 21px;
  border: 0;
  border-radius: ${(props) => Math.max(0, props.theme.borderRadius - 1)}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 10px;
  font-size: 12px;
  font-weight: bold;
  background: transparent;
  border-color: transparent;

  :hover {
    background: rgba(128, 128, 128, 0.3);
  }
  :active {
    background: rgba(128, 128, 128, 0.4);
  }
  svg {
    width: 12px;
    height: 12px;
    fill: ${(props) => props.theme.colors.input.text};
  }
`;

export const ScriptEventHeaderTitle = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  height: 25px;
`;

interface ScriptEventHeaderCaretProps {
  open?: boolean;
}

export const ScriptEventHeaderCaret = styled.div<ScriptEventHeaderCaretProps>`
  svg {
    fill: ${(props) => props.theme.colors.scripting.header.text};
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    transform: rotate(${(props) => (props.open ? 90 : 0)}deg);
  }
`;

interface ScriptEventHeaderProps {
  conditional: boolean;
  nestLevel: number;
  comment?: boolean;
  child?: boolean;
  altBg?: boolean;
}

export const ScriptEventHeader = styled.div<ScriptEventHeaderProps>`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 10px;
  padding-left: 10px;
  height: 25px;
  background: linear-gradient(
    0deg,
    ${(props) => props.theme.colors.scripting.header.backgroundAlt},
    ${(props) => props.theme.colors.scripting.header.background}
  );

  color: ${(props) => props.theme.colors.scripting.header.text};
  line-height: 12px;
  cursor: move;

  &:hover:before {
    content: "⋮";
    position: absolute;
    left: 3px;
    top: 6px;
  }

  ${(props) =>
    props.comment
      ? css`
          &&& {
            background: linear-gradient(
              0deg,
              ${(props) =>
                props.theme.colors.scripting.header.commentBackgroundAlt},
              ${(props) =>
                props.theme.colors.scripting.header.commentBackground}
            );
          }
        `
      : ""}

  ${(props) =>
    props.conditional
      ? css`
          background: transparent;
        `
      : ""}

  ${(props) =>
    props.child
      ? css`
          padding-left: 0;
        `
      : ""}
`;

interface ScriptEventBranchHeaderProps {
  conditional: boolean;
  nestLevel: number;
  comment?: boolean;
  child?: boolean;
  altBg?: boolean;
  open?: boolean;
}

export const ScriptEventBranchHeader = styled.div<ScriptEventBranchHeaderProps>`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 8px;
  // margin-left: -10px;
  // margin-right: -10px;
  margin: -10px;
  // && {
  //   margin: -10px -10px -10px 0px;
  // }

  && {
    // background: red;
    margin-top: -5px;
    margin-right: -5px;
    margin-bottom: -5px;
    margin-left: calc(10px - min(50px, max(10px, 5%)));
    flex-basis: 100%;
  }

  height: 25px;
  color: ${(props) => props.theme.colors.scripting.header.text};
  line-height: 12px;

  ${(props) =>
    !props.open
      ? css`
          margin-bottom: -10px;
        `
      : ""}
`;

interface ScriptEventFormWrapperProps {
  conditional: boolean;
  nestLevel: number;
  altBg?: boolean;
}

export const ScriptEventFormWrapper = styled.div<ScriptEventFormWrapperProps>`
  position: relative;
`;

export const ScriptEventFormNest = styled.div`
  position: absolute;
  top: 0;
  left: 0px;
  bottom: 0;
  width: 10px;
  :hover {
    background: ${(props) => props.theme.colors.translucent};
    mix-blend-mode: multiply;
  }
`;

export const ScriptEventFields = styled.div`
  // border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  // display: grid;
  // grid-template-columns: 1fr 1fr;
  // gap: 10px 10px;

  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;

  padding: 5px;

  & > * {
    // grid-column-end: span 2;
    flex-grow: 1;
    // min-width: 280px;
    // min-width: 90%;
    // width: 90%;
    // max-width: 280px;
    // flex: 1 0 auto;
    flex-grow: 1;
    flex-basis: 220px;
    margin: 5px;
  }
`;

interface ScriptEventFieldProps {
  halfWidth?: boolean;
}

export const ScriptEventField = styled.div<ScriptEventFieldProps>`
  // padding: 10px;
  ${(props) =>
    props.halfWidth
      ? css`
          // grid-column-end: span 1;
          // min-width: 140px;
          // min-width: 45%;
          // width: 40%;
          // max-width: 140px;

          // flex: 1 0 auto;
          flex-basis: 100px;
        `
      : ""}
`;

export const ScriptEditorChildren = styled.div`
  // border: 1px solid ${(props) => props.theme.colors.sidebar.border};
  // box-shadow: ${(props) => props.theme.colors.scripting.children.boxShadow};
  // border-right: 0;
  // margin-right: -10px;
  // border-top-left-radius: 8px;
  // border-bottom-left-radius: 8px;
  // overflow: hidden;

  // max-width: none;
  // width: 100%;
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 100%;

  // margin: 5px 0 5px 5px;
  // background: ${(props) => props.theme.colors.sidebar.background};

  ${ScriptEventBranchHeader} + & {
    // margin-top: -5px;
  }
`;

interface ScriptEventWrapperProps {
  conditional: boolean;
  nestLevel: number;
  altBg?: boolean;
}

export const ScriptEventWrapper = styled.div<ScriptEventWrapperProps>`
  background-color: ${(props) => props.theme.colors.scripting.form.background};
  color: ${(props) => props.theme.colors.text};

  ${(props) =>
    props.conditional
      ? css`
          background: ${(props) =>
            props.theme.colors.scripting.header.nest1Background};
          color: ${(props) => props.theme.colors.scripting.header.text};

          & > div > div > ${ScriptEventFields} {
            padding-top: 0px;
            margin-top: -5px;
            padding-left: 5%;
            margin-left: -10px;
            padding-left: min(50px, max(10px, 5%));
          }
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest1BackgroundAlt},
            ${props.theme.colors.scripting.header.nest1Background}
          );
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest2BackgroundAlt},
            ${props.theme.colors.scripting.header.nest2Background}
          );
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest3BackgroundAlt},
            ${props.theme.colors.scripting.header.nest3Background}
          );
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest4BackgroundAlt},
            ${props.theme.colors.scripting.header.nest4Background}
          );
        `
      : ""}
    & ~& {
    // border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  }
`;
