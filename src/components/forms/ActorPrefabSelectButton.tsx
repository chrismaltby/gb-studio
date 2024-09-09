import React, { FC, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { actorPrefabSelectors } from "store/features/entities/entitiesState";
import { SelectMenu, selectMenuStyleProps } from "ui/form/Select";
import { RelativePortal } from "ui/layout/RelativePortal";
import { useAppSelector } from "store/hooks";
import { ActorPrefabSelect } from "./ActorPrefabSelect";
import { PillButton } from "ui/buttons/PillButton";
import { CaretDownIcon } from "ui/icons/Icons";
import { actorName } from "shared/lib/entities/entitiesHelpers";

interface ActorPrefabSelectButtonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  min-width: 67px;
  & * {
    min-width: 0;
  }

  ${PillButton} {
    display: flex;
    align-items: center;
    span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    svg {
      margin-left: 5px;
      max-width: 8px;
      max-height: 8px;
    }
  }
`;

const ButtonCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
`;

export const ActorPrefabSelectButton: FC<ActorPrefabSelectButtonProps> = ({
  name,
  value,
  onChange,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const prefab = useAppSelector((state) =>
    actorPrefabSelectors.selectById(state, value || "")
  );
  const prefabIds = useAppSelector(actorPrefabSelectors.selectIds);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [buttonFocus, setButtonFocus] = useState<boolean>(false);

  useEffect(() => {
    if (buttonFocus) {
      window.addEventListener("keydown", onKeyDownClosed);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDownClosed);
    };
  }, [buttonFocus]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", onKeyDownOpen);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDownOpen);
    };
  }, [isOpen]);

  const onKeyDownClosed = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setIsOpen(true);
    }
  };

  const onKeyDownOpen = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const openMenu = () => {
    setIsOpen(true);
    cancelDelayedButtonFocus();
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const onSelectChange = (newValue: string) => {
    closeMenu();
    onChange?.(newValue);
    buttonRef.current?.focus();
  };

  const onButtonFocus = () => {
    setButtonFocus(true);
  };

  const onButtonBlur = () => {
    setButtonFocus(false);
  };

  const delayedButtonFocus = () => {
    timerRef.current = setTimeout(() => {
      buttonRef.current?.focus();
    }, 100);
  };

  const cancelDelayedButtonFocus = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const prefabName =
    (prefab && actorName(prefab, prefabIds.indexOf(prefab.id))) ??
    l10n("FIELD_NONE");

  return (
    <Wrapper>
      <PillButton
        id={name}
        ref={buttonRef}
        onClick={openMenu}
        onFocus={onButtonFocus}
        onBlur={onButtonBlur}
      >
        <span>{prefabName}</span>
        <CaretDownIcon />
      </PillButton>
      {isOpen && <ButtonCover onMouseDown={delayedButtonFocus} />}
      <div style={{ position: "absolute", top: "100%", left: "100%" }}>
        {isOpen && (
          <RelativePortal pin="top-right">
            <SelectMenu>
              <ActorPrefabSelect
                name={name}
                value={value}
                onChange={onSelectChange}
                onBlur={closeMenu}
                {...selectMenuStyleProps}
              />
            </SelectMenu>
          </RelativePortal>
        )}
      </div>
    </Wrapper>
  );
};
