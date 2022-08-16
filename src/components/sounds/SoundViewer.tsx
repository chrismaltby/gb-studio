import React from "react";
import { useDispatch } from "react-redux";
import { Sound } from "store/features/entities/entitiesTypes";
import soundfxActions from "store/features/soundfx/soundfxActions";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { PlayIcon } from "ui/icons/Icons";

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

export const SoundViewer = ({ file }: SoundViewerProps) => {
  const dispatch = useDispatch();
  return (
    <Wrapper>
      <Button
        size="large"
        variant="transparent"
        onClick={() => {
          dispatch(
            soundfxActions.playSoundFx({ effect: file.id, effectIndex: 0 })
          );
        }}
      >
        <PlayIcon />
      </Button>
      {file.name}
    </Wrapper>
  );
};
