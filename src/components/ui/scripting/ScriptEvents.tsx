import React, { forwardRef, ReactNode } from "react";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { Checkbox } from "ui/form/Checkbox";
import useResizeObserver from "ui/hooks/use-resize-observer";
import { ArrowIcon, BreakpointIcon, CommentIcon } from "ui/icons/Icons";
import {
  StyledScriptEditorChildren,
  StyledScriptEditorChildrenBorder,
  StyledScriptEditorChildrenLabel,
  StyledScriptEditorChildrenWrapper,
  StyledScriptEventBranchHeader,
  StyledScriptEventBranchHeaderFields,
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
import { FixedSpacer, FlexGrow } from "ui/spacing/Spacing";

export const ScriptEventPlaceholder = () => <StyledScriptEventPlaceholder />;

export const ScriptEventRenameInput = (
  props: React.InputHTMLAttributes<HTMLInputElement>,
) => <StyledScriptEventRenameInput {...props} />;

export const ScriptEventRenameInputCompleteButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => <StyledScriptEventRenameInputCompleteButton {...props} />;

interface ScriptEventHeaderProps {
  scriptEventId: string;
  nestLevel: number;
  isConditional?: boolean;
  isComment?: boolean;
  isDisabled?: boolean;
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
  onToggleSelection?: () => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const PreventDrag = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
    >
      {children}
    </div>
  );
};

export const ScriptEventHeader = forwardRef<
  HTMLDivElement,
  ScriptEventHeaderProps
>(
  (
    {
      scriptEventId,
      isConditional,
      nestLevel,
      isComment,
      isDisabled,
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
      onToggleSelection,
      onContextMenu,
      onMouseEnter,
      children,
    },
    outerRef,
  ) => {
    return (
      <StyledScriptEventHeader
        ref={outerRef}
        id={`script-event-header-${scriptEventId}`}
        $nestLevel={nestLevel}
        $isConditional={isConditional}
        $isComment={isComment}
        $isDisabled={isDisabled}
        $altBg={altBg}
        $isMoveable={isMoveable}
        $isSelected={isSelected}
        $isExecuting={isExecuting}
        onMouseEnter={onMouseEnter}
      >
        <StyledScriptEventHeaderTitle
          onClick={onToggle}
          onContextMenu={onContextMenu}
        >
          <PreventDrag>
            {!isComment && !isDisabled ? (
              <StyledScriptEventHeaderCaret $isOpen={isOpen}>
                <ArrowIcon />
              </StyledScriptEventHeaderCaret>
            ) : (
              <StyledScriptEventHeaderCaret>
                <CommentIcon />
              </StyledScriptEventHeaderCaret>
            )}
          </PreventDrag>
          <FixedSpacer width={5} />
          {children}
        </StyledScriptEventHeaderTitle>
        {isMoveable && (
          <PreventDrag>
            <Checkbox
              id="selectEvent"
              name="selectEvent"
              checked={isSelected}
              onChange={onToggleSelection}
            />
          </PreventDrag>
        )}
        {isBreakpoint && breakpointTitle && (
          <StyledScriptEventHeaderBreakpointIndicator title={breakpointTitle}>
            <BreakpointIcon />
          </StyledScriptEventHeaderBreakpointIndicator>
        )}
        {menuItems && (
          <PreventDrag>
            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
              onMouseDown={onOpenMenu}
            >
              {menuItems}
            </DropdownButton>
          </PreventDrag>
        )}
      </StyledScriptEventHeader>
    );
  },
);

interface ScriptEventBranchHeaderProps {
  nestLevel: number;
  isOpen: boolean;
  altBg: boolean;
  children?: ReactNode;
  label?: ReactNode;
  onToggle?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const ScriptEventBranchHeader = ({
  nestLevel = 0,
  isOpen,
  altBg,
  children,
  label,
  onToggle,
}: ScriptEventBranchHeaderProps) => {
  return (
    <StyledScriptEventBranchHeader
      $nestLevel={nestLevel}
      $altBg={altBg}
      $isOpen={isOpen}
      onClick={onToggle}
    >
      <StyledScriptEventHeaderCaret $isOpen={isOpen}>
        <ArrowIcon />
      </StyledScriptEventHeaderCaret>
      <FixedSpacer width={5} />
      {label}
      {children && (
        <StyledScriptEventBranchHeaderFields
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </StyledScriptEventBranchHeaderFields>
      )}
      <FlexGrow />
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
  title?: string;
}

export const ScriptEventField = ({
  halfWidth,
  inline,
  alignBottom,
  flexGrow,
  flexBasis,
  minWidth,
  children,
  title,
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
    title={title}
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
