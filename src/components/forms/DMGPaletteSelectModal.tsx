import { DMG_PALETTE } from "consts";
import React, { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import l10n from "shared/lib/lang/l10n";
import { MonoOBJPalette, MonoBGPPalette } from "shared/lib/resources/types";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { Label } from "ui/form/Label";
import { FormRow } from "ui/form/layout/FormLayout";
import { NumberInput } from "ui/form/NumberInput";

type DMGPaletteSelectModalProps = {
  onBlur: () => void;
  onReset: () => void;
  name: string;
  label?: string;
  showName?: boolean;
} & (
  | {
      isSpritePalette: true;
      value: MonoOBJPalette;
      onChange: (palette: MonoOBJPalette) => void;
    }
  | {
      isSpritePalette?: false;
      value: MonoBGPPalette;
      onChange: (palette: MonoBGPPalette) => void;
    }
);

const Form = styled.form<{ $showName?: boolean }>`
  min-width: 300px;
  padding-top: 5px;

  ${Label} {
    margin: 5px 10px;
  }
  ${(props) =>
    props.$showName
      ? `
        min-width: 200px;
  padding-top: 0px;
      `
      : ""}
`;

const InputGrid = styled.div<{ $isSpritePalette?: boolean }>`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  ${(props) =>
    props.$isSpritePalette
      ? `
        grid-template-columns: repeat(3, 1fr);
      `
      : ""}
`;

export const DMGPaletteSelectModal = ({
  name,
  label,
  value,
  showName,
  onChange,
  onReset,
  isSpritePalette,
  onBlur,
}: DMGPaletteSelectModalProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onBlur();
    }, 250);
  }, [onBlur]);

  useEffect(() => {
    return () => {
      // Cleanup timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const firstInput = document.querySelector(
      `#${name}_0`,
    ) as HTMLInputElement | null;
    requestAnimationFrame(() => {
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    });
  }, [name]);

  const onFocus = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const onFocusOut = useCallback(
    (event: React.FocusEvent<HTMLFormElement, Element>) => {
      if (event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      debouncedLeave();
    },
    [debouncedLeave],
  );

  const onResetBtn = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      onReset();
    },
    [onReset],
  );

  const fields = isSpritePalette ? [0, 1, 2] : [0, 1, 2, 3];

  return (
    <Form onFocus={onFocus} onBlur={onFocusOut} $showName={showName}>
      {showName && (
        <Label>
          {l10n("FIELD_MONOCHROME_PALETTE")}: {label}
        </Label>
      )}
      <FormRow>
        <InputGrid $isSpritePalette={isSpritePalette}>
          {fields.map((index) => (
            <NumberInput
              key={index}
              style={{
                backgroundColor: `#${DMG_PALETTE.colors[value[index]]}`,
                color: `#${DMG_PALETTE.colors[(value[index] + 2) % 4]}`,
              }}
              id={`${name}_${index}`}
              name={`${name}_${index}`}
              min={0}
              max={3}
              value={value[index]}
              onChange={(e) => {
                const newSingleValue = castEventToInt(e, 0);
                if (
                  newSingleValue === 0 ||
                  newSingleValue === 1 ||
                  newSingleValue === 2 ||
                  newSingleValue === 3
                ) {
                  if (isSpritePalette) {
                    const newValue = [...value] as MonoOBJPalette;
                    newValue[index] = newSingleValue;
                    onChange(newValue);
                  } else {
                    const newValue = [...value] as MonoBGPPalette;
                    newValue[index] = newSingleValue;
                    onChange(newValue);
                  }
                }
              }}
              onFocus={(e) => e.currentTarget.select()}
            />
          ))}
        </InputGrid>
      </FormRow>
      <FormRow>
        <Button size="small" onClick={onResetBtn}>
          {l10n("FIELD_RESTORE_DEFAULT")}
        </Button>
      </FormRow>
    </Form>
  );
};
