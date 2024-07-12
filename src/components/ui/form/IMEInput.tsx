import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Input } from "ui/form/Input";
import { useIMEIsComposing } from "ui/hooks/use-ime-is-composing";

export const IMEInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    readonly displaySize?: "small" | "medium" | "large";
  }
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
    [isComposing, onKeyDown]
  );

  return <Input ref={inputRef} onKeyDown={onKeyDownInner} {...rest} />;
});

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
    [isComposing, onKeyDown]
  );

  return <input ref={inputRef} onKeyDown={onKeyDownInner} {...rest} />;
});
