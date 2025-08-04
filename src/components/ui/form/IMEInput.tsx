import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { StyledInput } from "ui/form/style";
import { useIMEIsComposing } from "ui/hooks/use-ime-is-composing";

export interface IMEInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly displaySize?: "small" | "medium" | "large";
}

export const IMEInput = forwardRef<HTMLInputElement, IMEInputProps>(
  ({ onKeyDown, displaySize, ...rest }, outerRef) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isComposing = useIMEIsComposing(inputRef);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    useImperativeHandle(outerRef, () => inputRef.current!, []);

    const onKeyDownInner = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isComposing) {
          onKeyDown?.(e);
        }
      },
      [isComposing, onKeyDown],
    );

    return (
      <StyledInput
        ref={inputRef}
        onKeyDown={onKeyDownInner}
        $displaySize={displaySize}
        {...rest}
      />
    );
  },
);

export const IMEUnstyledInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ onKeyDown, ...rest }, outerRef) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useIMEIsComposing(inputRef);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  useImperativeHandle(outerRef, () => inputRef.current!, []);

  const onKeyDownInner = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isComposing) {
        onKeyDown?.(e);
      }
    },
    [isComposing, onKeyDown],
  );

  return <input ref={inputRef} onKeyDown={onKeyDownInner} {...rest} />;
});
