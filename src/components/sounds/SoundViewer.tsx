import l10n from "shared/lib/lang/l10n";
import React, { useState } from "react";
import { Sound } from "shared/lib/entities/entitiesTypes";
import soundfxActions from "store/features/soundfx/soundfxActions";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { FormContainer } from "ui/form/layout/FormLayout";
import { Label } from "ui/form/Label";
import { PlayIcon } from "ui/icons/Icons";
import { useAppDispatch } from "store/hooks";
import { NumberInput } from "ui/form/NumberInput";

interface SoundViewerProps {
  file: Sound;
}

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const SettingsWrapper = styled.div`
  margin-top: 20px;
  background-color: ${(props) => props.theme.colors.sidebar.background};
  border-radius: 8px;
  padding: 10px;
`;

export const SoundViewer = ({ file }: SoundViewerProps) => {
  const dispatch = useAppDispatch();

  const [effectIndex, setEffectIndex] = useState(0);

  return (
    <Wrapper>
      <Button
        size="large"
        variant="transparent"
        onClick={() => {
          dispatch(
            soundfxActions.playSoundFx({
              effect: file.id,
              effectIndex: effectIndex,
            }),
          );
        }}
      >
        <PlayIcon />
      </Button>
      {file.name}

      {file.type === "fxhammer" && file.numEffects && file.numEffects > 0 ? (
        <SettingsWrapper>
          <FormContainer>
            <Label htmlFor="effectIndex">{l10n("FIELD_EFFECT_INDEX")}</Label>
            <NumberInput
              name="effectIndex"
              type="number"
              min={0}
              max={file.numEffects - 1}
              value={effectIndex ?? 0}
              onChange={(e) => {
                if (file.numEffects && file.numEffects > 0) {
                  setEffectIndex(
                    Math.max(
                      0,
                      Math.min(file.numEffects - 1, parseInt(e.target.value)),
                    ),
                  );
                }
              }}
            ></NumberInput>
          </FormContainer>
        </SettingsWrapper>
      ) : (
        ""
      )}
    </Wrapper>
  );
};
