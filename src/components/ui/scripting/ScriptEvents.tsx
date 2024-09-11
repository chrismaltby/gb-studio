import React, { forwardRef, ReactNode } from "react";
import styled, { css } from "styled-components";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { ArrowIcon, BreakpointIcon, CommentIcon } from "ui/icons/Icons";
import {
  StyledScriptEventBranchHeader,
  StyledScriptEventFields,
  StyledScriptEventFormWrapper,
  StyledScriptEventHeader,
  StyledScriptEventHeaderBreakpointIndicator,
  StyledScriptEventHeaderCaret,
  StyledScriptEventHeaderTitle,
  StyledScriptEventPlaceholder,
  StyledScriptEventRenameInput,
  StyledScriptEventRenameInputCompleteButton,
  StyledScriptEventWarning,
  StyledScriptEventWrapper,
} from "ui/scripting/style";
import { FixedSpacer } from "ui/spacing/Spacing";

export const ScriptEventPlaceholder = () => <StyledScriptEventPlaceholder />;

export const ScriptEventRenameInput = (
  props: React.InputHTMLAttributes<HTMLInputElement>
) => <StyledScriptEventRenameInput {...props} />;

export const ScriptEventRenameInputCompleteButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) => <StyledScriptEventRenameInputCompleteButton {...props} />;

interface ScriptEventHeaderProps {
  nestLevel: number;
  isConditional?: boolean;
  isComment?: boolean;
  isSelected?: boolean;
  isExecuting?: boolean;
  isMoveable?: boolean;
  isOpen: boolean;
  isBreakpoint?: boolean;
  altBg?: boolean;
  breakpointTitle?: string;
  children?: ReactNode;
  menuItems?: ReactNode;
  onOpenMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggle?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const ScriptEventHeader = forwardRef<
  HTMLDivElement,
  ScriptEventHeaderProps
>(
  (
    {
      isConditional,
      nestLevel,
      isComment,
      isSelected,
      isExecuting,
      isMoveable = true,
      isOpen,
      altBg,
      isBreakpoint,
      breakpointTitle,
      menuItems,
      onOpenMenu,
      onToggle,
      onContextMenu,
      children,
    },
    outerRef
  ) => {
    return (
      <StyledScriptEventHeader
        ref={outerRef}
        $nestLevel={nestLevel}
        $isConditional={isConditional}
        $isComment={isComment}
        $altBg={altBg}
        $isMoveable={isMoveable}
        $isSelected={isSelected}
        $isExecuting={isExecuting}
      >
        <StyledScriptEventHeaderTitle
          onClick={onToggle}
          onContextMenu={onContextMenu}
        >
          {!isComment ? (
            <StyledScriptEventHeaderCaret $isOpen={isOpen && !isComment}>
              <ArrowIcon />
            </StyledScriptEventHeaderCaret>
          ) : (
            <StyledScriptEventHeaderCaret>
              <CommentIcon />
            </StyledScriptEventHeaderCaret>
          )}
          <FixedSpacer width={5} />
          {children}
        </StyledScriptEventHeaderTitle>
        {isBreakpoint && breakpointTitle && (
          <StyledScriptEventHeaderBreakpointIndicator title={breakpointTitle}>
            <BreakpointIcon />
          </StyledScriptEventHeaderBreakpointIndicator>
        )}
        {menuItems && (
          <DropdownButton
            size="small"
            variant="transparent"
            menuDirection="right"
            onMouseDown={onOpenMenu}
          >
            {menuItems}
          </DropdownButton>
        )}
      </StyledScriptEventHeader>
    );
  }
);

interface ScriptEventBranchHeaderProps {
  nestLevel: number;
  isOpen: boolean;
  altBg: boolean;
  children?: ReactNode;
  onToggle?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const ScriptEventBranchHeader = ({
  nestLevel = 0,
  isOpen,
  altBg,
  children,
  onToggle,
}: ScriptEventBranchHeaderProps) => {
  return (
    <StyledScriptEventBranchHeader
      onClick={onToggle}
      $nestLevel={nestLevel}
      $altBg={altBg}
      $isOpen={isOpen}
    >
      <StyledScriptEventHeaderCaret $isOpen={isOpen}>
        <ArrowIcon />
      </StyledScriptEventHeaderCaret>
      <FixedSpacer width={5} />
      {children}
    </StyledScriptEventBranchHeader>
  );
};

interface ScriptEventFormWrapperProps {
  children?: ReactNode;
}

export const ScriptEventFormWrapper = ({
  children,
}: ScriptEventFormWrapperProps) => (
  <StyledScriptEventFormWrapper children={children} />
);

interface ScriptEventFieldsProps {
  children?: ReactNode;
}

export const ScriptEventFields = ({ children }: ScriptEventFieldsProps) => (
  <StyledScriptEventFields children={children} />
);

interface ScriptEventFieldProps {
  $halfWidth?: boolean;
  $inline?: boolean;
  $alignBottom?: boolean;
}

export const ScriptEventField = styled.div<ScriptEventFieldProps>`
  ${(props) =>
    props.$halfWidth
      ? css`
          flex-basis: 100px;
        `
      : ""}

  ${(props) =>
    props.$inline
      ? css`
          flex-basis: 0;
          flex-grow: 0;
          margin-left: -2px;
        `
      : ""}

  ${(props) =>
    props.$alignBottom
      ? css`
          align-self: flex-end;
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
  display: flex;
  width: 100%;
  max-width: 100%;
`;

interface ScriptEditorChildrenBorderProps {
  nestLevel: number;
}

export const ScriptEditorChildrenBorder = styled.div<ScriptEditorChildrenBorderProps>`
  border-left: 2px solid #ccc;
  width: 10px;
  border-radius: 10px;
  flex-shrink: 0;

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
  flex-grow: 1;
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-right: 0px;
  min-width: 0;
  align-self: flex-start;
`;

interface ScriptEditorChildrenLabelProps {
  nestLevel: number;
}

export const ScriptEditorChildrenLabel = styled.span<ScriptEditorChildrenLabelProps>`
  display: inline-block;
  position: sticky;
  top: 35px;
  left: 0px;
  padding: 10px 0px;
  font-size: 8px;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  writing-mode: vertical-rl;
  transform: rotate(180deg) translate(50%, 0);

  > span {
    display: inline-block;
    background: ${(props) => props.theme.colors.scripting.form.background};
    padding: 5px 0px;
    position: relative;
    left: -1px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

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

export const ScriptEventWrapper = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, outerRef) => <StyledScriptEventWrapper ref={outerRef} {...props} />);

interface ScriptEventFieldGroupProps {
  $halfWidth?: boolean;
  $wrapItems?: boolean;
  $alignBottom?: boolean;
}

export const ScriptEventFieldGroupWrapper = styled.div<ScriptEventFieldGroupProps>`
  ${(props) =>
    props.$halfWidth
      ? css`
          flex-basis: 100px;
        `
      : ""}
  ${(props) =>
    props.$alignBottom
      ? css`
          align-self: flex-end;
        `
      : ""}      
  & > div {
    margin: -10px;
    ${(props) =>
      !props.$wrapItems
        ? css`
            flex-wrap: nowrap;
          `
        : ""}
  }
`;

interface ScriptEventWarningProps {
  children?: ReactNode;
}

export const ScriptEventWarning = ({ children }: ScriptEventWarningProps) => (
  <StyledScriptEventWarning children={children} />
);
