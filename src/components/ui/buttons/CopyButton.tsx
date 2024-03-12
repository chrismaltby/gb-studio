import React, { useCallback, useState } from "react";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { CheckIcon, CopyIcon } from "ui/icons/Icons";
import { Button } from "./Button";
import { useAppDispatch } from "store/hooks";

interface CopyButtonProps {
  value: string;
}

export const CopyButton = ({ value }: CopyButtonProps) => {
  const dispatch = useAppDispatch();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    dispatch(clipboardActions.copyText(value));
    setCopied(true);
  }, [dispatch, value]);

  const onMouseLeave = useCallback(() => {
    if (copied) {
      setCopied(false);
    }
  }, [copied]);

  return (
    <Button onClick={onCopy} onMouseLeave={onMouseLeave}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
};
