import React, { useCallback, useEffect, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import styled from "styled-components";
import { IMEUnstyledInput } from "ui/form/IMEInput";
import { CheckIcon } from "ui/icons/Icons";

export const Input = styled(IMEUnstyledInput)`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  border: 0;
  font-size: 11px;
  margin-left: -5px;
  padding-left: 5px;
  margin-right: -18px;
  border-radius: 4px;
`;

export const CompleteButton = styled.button`
  z-index: 10000;
  position: relative;
  top: 0px;
  left: -4px;
  width: 21px;
  height: 100%;
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

interface RenameInputProps {
  autoFocus?: boolean;
  value?: string;
  onRenameComplete: (newValue: string) => void;
  onRenameCancel: () => void;
}

export const RenameInput = ({
  autoFocus,
  value,
  onRenameComplete,
  onRenameCancel,
}: RenameInputProps) => {
  const [name, setName] = useState(value ?? "");

  const onRenameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.currentTarget.value);
    },
    []
  );

  const onRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onRenameCancel();
        setName(value ?? "");
      } else if (e.key === "Enter") {
        onRenameComplete(name);
      }
    },
    [name, onRenameCancel, onRenameComplete, value]
  );

  const onRenameBlur = useCallback(() => {
    onRenameComplete(name);
  }, [name, onRenameComplete]);

  useEffect(() => {
    setName(value ?? "");
  }, [value]);

  return (
    <>
      <Input
        autoFocus={autoFocus}
        value={name}
        onChange={onRenameChange}
        onKeyDown={onRenameKeyDown}
        onBlur={onRenameBlur}
      />
      <CompleteButton onClick={onRenameBlur} title={l10n("FIELD_RENAME")}>
        <CheckIcon />
      </CompleteButton>
    </>
  );
};
