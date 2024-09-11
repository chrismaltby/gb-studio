import React, { forwardRef, ReactNode } from "react";
import { DropdownButton } from "ui/buttons/DropdownButton";
import useResizeObserver from "ui/hooks/use-resize-observer";
import { ArrowIcon, BreakpointIcon, CommentIcon } from "ui/icons/Icons";
import {
  StyledScriptEditorChildren,
  StyledScriptEditorChildrenBorder,
  StyledScriptEditorChildrenLabel,
  StyledScriptEditorChildrenWrapper,
  StyledScriptEventBranchHeader,
  StyledScriptEventField,
  StyledScriptEventFieldGroup,
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
  halfWidth?: boolean;
  inline?: boolean;
  alignBottom?: boolean;
  flexGrow?: number;
  flexBasis?: string | number;
  minWidth?: string | number;
  children?: ReactNode;
}

export const ScriptEventField = ({
  halfWidth,
  inline,
  alignBottom,
  flexGrow,
  flexBasis,
  minWidth,
  children,
}: ScriptEventFieldProps) => (
  <StyledScriptEventField
    $halfWidth={halfWidth}
    $inline={inline}
    $alignBottom={alignBottom}
    style={{
      flexBasis: flexBasis,
      flexGrow: flexGrow,
      minWidth: minWidth,
    }}
    children={children}
  />
);

interface ScriptEditorChildrenProps {
  nestLevel: number;
  title: string;
  label: string;
  shortLabel: string;
  children: ReactNode;
}

export const ScriptEditorChildren = forwardRef<
  HTMLDivElement,
  ScriptEditorChildrenProps
>(({ nestLevel, title, label, shortLabel, children }, outerRef) => {
  const [ref, size] = useResizeObserver<HTMLDivElement>();
  const showLabel = size.height !== undefined;
  const showFullLabel = size.height && size.height > 200;
  const labelText = showFullLabel ? label : shortLabel;
  const labelMaxHeight = Math.max(80, size.height ? size.height : 0);
  return (
    <StyledScriptEditorChildren ref={outerRef}>
      <StyledScriptEditorChildrenBorder
        title={title}
        $nestLevel={nestLevel}
        style={{ maxHeight: labelMaxHeight }}
      >
        {label && (
          <StyledScriptEditorChildrenLabel $nestLevel={nestLevel}>
            <span
              style={{
                maxHeight: labelMaxHeight - 30,
              }}
            >
              {showLabel && labelText}
            </span>
          </StyledScriptEditorChildrenLabel>
        )}
      </StyledScriptEditorChildrenBorder>
      <StyledScriptEditorChildrenWrapper ref={ref}>
        {children}
      </StyledScriptEditorChildrenWrapper>
    </StyledScriptEditorChildren>
  );
});

export const ScriptEventWrapper = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, outerRef) => <StyledScriptEventWrapper ref={outerRef} {...props} />);

interface ScriptEventFieldGroupProps {
  halfWidth?: boolean;
  wrapItems?: boolean;
  alignBottom?: boolean;
  flexGrow?: number;
  flexBasis?: string | number;
  minWidth?: string | number;
  children?: ReactNode;
}

export const ScriptEventFieldGroup = ({
  halfWidth,
  wrapItems,
  alignBottom,
  flexGrow,
  flexBasis,
  minWidth,
  children,
}: ScriptEventFieldGroupProps) => (
  <StyledScriptEventFieldGroup
    $halfWidth={halfWidth}
    $wrapItems={wrapItems}
    $alignBottom={alignBottom}
    style={{
      flexGrow: flexGrow,
      flexBasis: flexBasis,
      minWidth: minWidth,
    }}
    children={children}
  />
);

interface ScriptEventWarningProps {
  children?: ReactNode;
}

export const ScriptEventWarning = ({ children }: ScriptEventWarningProps) => (
  <StyledScriptEventWarning children={children} />
);
