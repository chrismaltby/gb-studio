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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
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
  margin: -15px;

  && {
    margin-right: -5px;
    margin-left: -5px;
    flex-basis: 100%;
    max-width: 100%;
  }

  height: 25px;
  color: ${(props) => props.theme.colors.scripting.header.text};
  line-height: 12px;

  ${(props) =>
    props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.branch.nest1Background};
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.branch.nest2Background};
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.branch.nest3Background};
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.branch.nest4Background};
        `
      : ""}


  ${(props) =>
    !props.open
      ? css`
          && {
            margin-bottom: -5px;
          }
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

export const ScriptEventFields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  padding: 5px;

  & > * {
    flex-grow: 1;
    flex-grow: 1;
    flex-basis: 220px;
    margin: 5px;
    max-width: calc(100% - 10px);
  }
`;

interface ScriptEventFieldProps {
  halfWidth?: boolean;
  inline?: boolean;
}

export const ScriptEventField = styled.div<ScriptEventFieldProps>`
  ${(props) =>
    props.halfWidth
      ? css`
          flex-basis: 100px;
        `
      : ""}

      ${(props) =>
        props.inline
          ? css`
              flex-basis: 0;
              flex-grow: 0;
              margin-left: -2px;
            `
          : ""}
  }

`;

interface ScriptEditorChildrenProps {
  nestLevel: number;
}

export const ScriptEditorChildren = styled.div<ScriptEditorChildrenProps>`
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 100%;
  border-left: 1px dotted
    ${(props) => props.theme.colors.scripting.header.backgroundAlt};
  padding-left: 10px;
  padding-left: calc(max(10px, min(4%, 50px)));
  box-sizing: border-box;
  border-radius: 10px;
  position: relative;
  min-height: 50px;
  border-left: 2px solid #ccc;
  width: 100%;
  max-width: 100%;

  ${(props) =>
    props.nestLevel % 4 === 0
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest1Border};
        `
      : ""}
  ${(props) =>
    props.nestLevel % 4 === 1
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest2Border};
        `
      : ""}
    ${(props) =>
    props.nestLevel % 4 === 2
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest3Border};
        `
      : ""}
    ${(props) =>
    props.nestLevel % 4 === 3
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest4Border};
        `
      : ""}
`;

export const ScriptEditorChildrenWrapper = styled.div`
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-right: 0px;
`;

interface ScriptEditorChildrenLabelProps {
  nestLevel: number;
}

export const ScriptEditorChildrenLabel = styled.div<ScriptEditorChildrenLabelProps>`
  position: absolute;
  top: 50%;
  left: -1px;
  transform: translate(-50%, -50%) rotate(270deg);
  font-size: 8px;
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 0px 5px;
  text-transform: uppercase;

  ${(props) =>
    props.nestLevel % 4 === 0
      ? css`
          color: ${props.theme.colors.scripting.children.nest1Text};
        `
      : ""}
  ${(props) =>
    props.nestLevel % 4 === 1
      ? css`
          color: ${props.theme.colors.scripting.children.nest2Text};
        `
      : ""}
           ${(props) =>
    props.nestLevel % 4 === 2
      ? css`
          color: ${props.theme.colors.scripting.children.nest3Text};
        `
      : ""}
               ${(props) =>
    props.nestLevel % 4 === 3
      ? css`
          color: ${props.theme.colors.scripting.children.nest4Text};
        `
      : ""}
`;

interface ScriptEventWrapperProps {
  conditional: boolean;
  nestLevel: number;
  altBg?: boolean;
}

export const ScriptEventWrapper = styled.div<ScriptEventWrapperProps>`
  background-color: ${(props) => props.theme.colors.scripting.form.background};
  color: ${(props) => props.theme.colors.text};
`;

interface ScriptEventFieldGroupProps {
  halfWidth?: boolean;
}

export const ScriptEventFieldGroupWrapper = styled.div<ScriptEventFieldGroupProps>`
  ${(props) =>
    props.halfWidth
      ? css`
          flex-basis: 100px;
        `
      : ""}
  & > div {
    margin: -10px;
    flex-wrap: nowrap;
  }
`;

export const ScriptEventWarning = styled.div`
  background: #ffc107;
  color: #000;
  padding: 10px;
  font-size: 11px;
`;
