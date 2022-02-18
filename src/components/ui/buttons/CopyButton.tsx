import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { CheckIcon, CopyIcon } from "ui/icons/Icons";
import { Button } from "./Button";

interface CopyButtonProps {
  value: string;
}

export const CopyButton = ({ value }: CopyButtonProps) => {
  const dispatch = useDispatch();
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
