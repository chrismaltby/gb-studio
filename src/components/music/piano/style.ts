import styled, { css } from "styled-components";
import {
  OCTAVE_SIZE,
  PIANO_ROLL_CELL_SIZE,
  PIANO_ROLL_FOOTER_HEIGHT,
  PIANO_ROLL_HEADER_HEIGHT,
  PIANO_ROLL_PIANO_WIDTH,
  TOTAL_NOTES,
  TRACKER_PATTERN_LENGTH,
} from "consts";
import { StyledButton } from "ui/buttons/style";

export const StyledPianoRollWrapper = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
`;

export const StyledPianoRollScrollWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  overscroll-behavior: none;
`;

export const StyledPianoRollScrollCanvas = styled.div`
  position: relative;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES + 60}px;
  max-width: 0;
`;

export const StyledPianoRollScrollLeftWrapper = styled.div`
  position: sticky;
  left: 0;
  width: ${PIANO_ROLL_PIANO_WIDTH}px;
  background: ${(props) => props.theme.colors.sidebar.background};
  z-index: 3;
  margin-bottom: -${PIANO_ROLL_FOOTER_HEIGHT + 1}px;
`;

export const StyledPianoRollScrollLeftHeaderSpacer = styled.div`
  content: "";
  display: block;
  position: sticky;
  top: 0;
  width: ${PIANO_ROLL_PIANO_WIDTH + 1}px;
  height: ${PIANO_ROLL_HEADER_HEIGHT}px;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
  z-index: 20;
  margin-top: -${PIANO_ROLL_HEADER_HEIGHT}px;
  box-sizing: border-box;
`;

export const StyledPianoRollScrollLeftFXSpacer = styled.div`
  display: flex;
  position: sticky;
  bottom: 0;
  width: ${PIANO_ROLL_PIANO_WIDTH + 1}px;
  height: ${PIANO_ROLL_FOOTER_HEIGHT + 1}px;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
  z-index: 20;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  svg {
    width: 14px;
    height: 14px;
    fill: ${(props) => props.theme.colors.text};
  }
`;

export const StyledPianoRollScrollTopWrapper = styled.div`
  position: sticky;
  top: 0;
  height: ${PIANO_ROLL_HEADER_HEIGHT}px;
  background: ${(props) => props.theme.colors.sidebar.background};
  z-index: 2;
  display: flex;
  box-shadow: 0 5px 5px rgb(0 0 0 / 15%);
`;

export const StyledPianoRollScrollHeaderFooterSpacer = styled.div`
  width: ${PIANO_ROLL_PIANO_WIDTH}px;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
  position: sticky;
  top: 0;
  left: 0;
  z-index: 4;
  height: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
`;

export const StyledPianoRollScrollBottomWrapper = styled.div`
  position: sticky;
  bottom: 0;
  height: ${PIANO_ROLL_FOOTER_HEIGHT}px;
  background: ${(props) => props.theme.colors.sidebar.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  z-index: 2;
  display: flex;
  box-shadow: 0 -5px 5px rgb(0 0 0 / 15%);
`;

export const StyledPianoRollScrollContentWrapper = styled.div`
  position: absolute;
  top: ${PIANO_ROLL_HEADER_HEIGHT}px;
  left: ${PIANO_ROLL_PIANO_WIDTH}px;
  z-index: 0;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES}px;
  display: flex;
`;

export const StyledPianoKeyboard = styled.div`
  position: relative;
  width: ${PIANO_ROLL_PIANO_WIDTH + 1}px;
  background: white;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES}px;
`;

const blackKeyStyle = css`
  height: ${PIANO_ROLL_CELL_SIZE}px;
  width: ${PIANO_ROLL_PIANO_WIDTH - 20}px;
  background: linear-gradient(45deg, #636363, black);
  background: linear-gradient(
    90deg,
    rgba(2, 0, 36, 1) 0%,
    rgba(99, 99, 99, 1) 90%,
    rgba(0, 0, 0, 1) 98%
  );
  border-bottom: none;
  border-radius: 0 2px 2px 0;
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 3px 0px;
  top: ${-0.5 * PIANO_ROLL_CELL_SIZE}px;
  margin-bottom: ${-PIANO_ROLL_CELL_SIZE}px;
  z-index: 2;
`;

const highlightStyle = css`
  &:after {
    content: "";
    position: absolute;
    top: 0px;
    left: 0px;
    bottom: 0px;
    right: 0px;
    background: linear-gradient(90deg, #3aa1d5 0%, #93d6f7);
    opacity: 0.5;
  }
`;

interface StyledPianoKeyProps {
  $color: "white" | "black";
  $tall?: boolean;
  $highlight?: boolean;
}

export const StyledPianoKey = styled.div<StyledPianoKeyProps>`
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: #90a4ae;
  font-weight: bold;
  font-size: 10px;
  padding-bottom: 1px;
  padding-right: 3px;
  position: relative;
  height: ${(props) => (props.$tall ? 2 : 1.5) * PIANO_ROLL_CELL_SIZE}px;
  width: 100%;
  background: white;
  border-bottom: 1px solid #cfd8dc;
  box-shadow: rgba(0, 0, 0, 0.1) -2px 0px 2px 0px inset;
  ${(props) => (props.$color === "black" ? blackKeyStyle : "")}
  ${(props) => (props.$highlight ? highlightStyle : "")}
  &:last-child {
    border-bottom: none;
  }
  border-right: 1px solid
    ${(props) => props.theme.colors.tracker.rollCell.border};
`;

export const StyledPianoRollSequenceHeader = styled.div`
  position: relative;
  width: ${TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE}px;
  height: 100%;
  text-align: center;
  border-left: 1px solid ${(props) => props.theme.colors.sidebar.border};
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  &:nth-child(2) {
    border-left: 1px solid transparent;
  }
  &:nth-last-child(2) {
    border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
  }
`;

const buildTickBackground = (borderColor: string) => {
  const steps: string[] = [];
  const NUM_STEPS = 16;
  const STEP_SIZE = 4;
  const PIANO_ROLL_CELL_SIZE = 18;

  for (let i = 0; i < NUM_STEPS; i++) {
    const startPx = i * STEP_SIZE * PIANO_ROLL_CELL_SIZE;
    const endPx = (i + 1) * STEP_SIZE * PIANO_ROLL_CELL_SIZE;
    steps.push(`transparent ${startPx}px`);
    steps.push(`transparent ${endPx - 1}px`);
    steps.push(`${borderColor} ${endPx - 1}px`);
    steps.push(`${borderColor} ${endPx}px`);
  }
  return `linear-gradient(90deg, ${steps.join(",")})`;
};

export const StyledPianoRollSequenceHeaderOrder = styled.div`
  display: flex;
  align-items: center;
  font-size: 11px;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
  height: 20px;
  box-sizing: border-box;
  background-image: ${(props) =>
    buildTickBackground(props.theme.colors.tracker.rollCell.border)};
  background-size: ${PIANO_ROLL_CELL_SIZE * TRACKER_PATTERN_LENGTH}px 5px;
  background-repeat: no-repeat;
  background-position: 0px calc(100% - 2px);
`;

export const StyledPianoRollSequenceHeaderTimeMarker = styled.div`
  width: ${PIANO_ROLL_CELL_SIZE * 2 - 1}px;
  font-size: 8px;
  height: 17px;
  padding-top: 2px;
  overflow: hidden;
  opacity: 0.5;
  border-left: ${PIANO_ROLL_CELL_SIZE * 6}px solid transparent;
  border-right: 1px solid transparent;
  &:first-child {
    border-left: ${PIANO_ROLL_CELL_SIZE * 7}px solid transparent;
  }
`;

export const StyledPianoRollSequenceHeaderText = styled.div`
  position: sticky;
  left: 51px;
  padding: 0 5px;

  ${StyledButton} {
    border-radius: 0px;
    min-height: 20px;
  }
`;

export const StyledPianoRollSequenceHeaderPattern = styled.div`
  flex-grow: 1;

  color: #000;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  font-size: 11px;

  ${StyledPianoRollSequenceHeaderText} {
    display: flex;
    align-items: center;
    height: 100%;
  }

  ${StyledPianoRollSequenceHeaderText}::before {
    position: absolute;
    content: "";
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.5) 00%,
      rgba(255, 255, 255, 0.1) 30%,
      rgba(255, 255, 255, 0) 100%
    );
    mix-blend-mode: overlay;
    width: 600%;
    height: 100%;
    display: flex;
    align-items: center;
    left: 0px;
  }

  ${StyledButton} {
    height: 14px;
    color: #000;
    padding: 0 5px;
    svg {
      fill: #000;
    }
  }

  span {
    height: 14px;
    color: #000;
    padding: 0 5px;
  }
`;

interface StyledPianoRollNoteProps {
  $instrument?: number;
  $usingPreviousInstrument?: boolean;
  $isSelected?: boolean;
  $isDragging?: boolean;
  $isVirtual?: boolean;
}

interface StyledPianoRollNoteSustainProps {
  $instrument?: number;
}

const pianoRollNoteFill = (instrument?: number) =>
  instrument !== undefined ? `var(--instrument-${instrument}-color)` : "black";

export const StyledPianoRollNoteSustain = styled.div<StyledPianoRollNoteSustainProps>`
  position: absolute;
  height: ${Math.max(PIANO_ROLL_CELL_SIZE - 10, 4)}px;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
  background: ${(props) => pianoRollNoteFill(props.$instrument)};
`;

export const StyledPianoRollNote = styled.div<StyledPianoRollNoteProps>`
  position: absolute;
  width: ${PIANO_ROLL_CELL_SIZE + 1}px;
  height: ${PIANO_ROLL_CELL_SIZE + 1}px;
  border: 1px solid black;
  box-sizing: border-box;
  text-align: center;
  line-height: 1.1em;
  background: ${(props) => pianoRollNoteFill(props.$instrument)};
  ${(props) =>
    props.$usingPreviousInstrument &&
    css`
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        ${pianoRollNoteFill(props.$instrument)} 2px,
        ${pianoRollNoteFill(props.$instrument)} 4px
      );
    `}

  ${(props) =>
    props.$isSelected &&
    css`
      z-index: 1;
    `}

  ${(props) =>
    props.$isSelected &&
    !props.$isDragging &&
    css`
      box-shadow: 0 0 0px 2px #c92c61;
    `}    

    ${(props) =>
      props.$isSelected &&
      props.$isDragging &&
      css`
        opacity: 0.6;
      `}

    ${(props) =>
      props.$isVirtual &&
      css`
        opacity: 0.4;
      `}

    border-radius: 2px;

  ${(props) =>
    props.$instrument !== undefined &&
    css`
      &::before {
        content: "";
        position: absolute;
        bottom: 0px;
        left: 0px;
        right: 0px;
        height: 2px;
        background: rgba(0, 0, 0, 0.25);
      }
      &::after {
        content: "";
        position: absolute;
        top: 1px;
        left: 1px;
        right: 1px;
        height: 2px;
        background: rgba(255, 255, 255, 0.6);
        mix-blend-mode: overlay;
      }
    `}
`;

export const StyledPianoRollNoteTouchBlocker = styled.div<{
  $isSelected: boolean;
}>`
  position: absolute;
  opacity: 0.5;
  touch-action: none;
  z-index: 10000;

  ${({ $isSelected }) => {
    const pad = $isSelected ? 20 : 10;
    return `
      left: -${pad}px;
      top: -${pad}px;
      width: ${PIANO_ROLL_CELL_SIZE + pad * 2}px;
      height: ${PIANO_ROLL_CELL_SIZE + pad * 2}px;
    `;
  }}
`;

interface StyledPianoRollEffectCellProps {
  $isSelected?: boolean;
  $instrument?: number;
}

export const StyledPianoRollEffectCell = styled.div<StyledPianoRollEffectCellProps>`
  position: absolute;
  width: ${PIANO_ROLL_CELL_SIZE + 1}px;
  height: 100%;
  top: -1px;
  border: 1px solid black;
  text-align: center;
  line-height: 1.1em;
  pointer-events: none;
  box-shadow: ${(props) =>
    props.$isSelected ? `0 0 0px 2px ${props.theme.colors.highlight}` : ""};
  z-index: ${(props) => (props.$isSelected ? 1 : 0)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  background: ${(props) =>
    props.$instrument !== undefined
      ? `var(--instrument-${props.$instrument}-color)`
      : props.theme.colors.button.activeBackground};

  color: ${(props) =>
    props.$instrument !== undefined
      ? `var(--instrument-${props.$instrument}-text-color)`
      : props.theme.colors.text};

  &::before {
    content: "";
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 2px;
    background: rgba(0, 0, 0, 0.1);
  }
  &::after {
    content: "";
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    height: 2px;
    background: rgba(255, 255, 255, 0.6);
    mix-blend-mode: overlay;
  }
`;

export const StyledPianoRollEffectRow = styled.div`
  font-family: monospace;
  position: relative;
  ${(props) => css`
    width: ${TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE}px;
    box-sizing: border-box;
    background-image: linear-gradient(
      90deg,
      ${props.theme.colors.tracker.rollCell.border} 1px,
      transparent 1px
    );
  background-size: ${PIANO_ROLL_CELL_SIZE}px ${PIANO_ROLL_CELL_SIZE}px,
    ${PIANO_ROLL_CELL_SIZE}px ${PIANO_ROLL_CELL_SIZE}px, ${PIANO_ROLL_CELL_SIZE * 8}px ${
      PIANO_ROLL_CELL_SIZE * OCTAVE_SIZE
    }px;
  }
  `}
`;

export const StyledPianoRollPlayhead = styled.div<{
  $isDefaultMarker?: boolean;
}>`
  pointer-events: none;
  z-index: 0;
  width: 2px;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES + PIANO_ROLL_CELL_SIZE}px;
  background: ${(props) => props.theme.colors.highlight};
  background-position-y: ${PIANO_ROLL_CELL_SIZE}px;
  background-repeat-y: no-repeat;
  background-size: ${PIANO_ROLL_CELL_SIZE * 8}px
    ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES + PIANO_ROLL_CELL_SIZE}px;
  position: absolute;
  top: 6px;
  bottom: 0;
  left: ${PIANO_ROLL_PIANO_WIDTH}px;

  &:before {
    content: "";
    position: absolute;
    top: 0px;
    left: -${PIANO_ROLL_CELL_SIZE / 2 - 1}px;
    border-top: ${PIANO_ROLL_CELL_SIZE - 4}px solid transparent;
    border-top-color: ${(props) => props.theme.colors.highlight};
    border-left: ${PIANO_ROLL_CELL_SIZE / 2}px solid transparent;
    border-right: ${PIANO_ROLL_CELL_SIZE / 2}px solid transparent;
  }

  ${(props) =>
    props.$isDefaultMarker &&
    css`
      background: transparent;
      &:before {
        border-top-color: ${(props) =>
          props.theme.colors.tracker.rollCell.border};
      }
    `}
`;

export const StyledPianoRollPatternsWrapper = styled.div`
  display: flex;
  position: relative;
  z-index: 1;
`;

export const StyledPianoRollSustainOverlay = styled.div<{ $width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => props.$width}px;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES}px;
  pointer-events: none;
  z-index: 0;
`;

export const StyledPianoRollSustainChannel = styled.div<{
  $active?: boolean;
  $width: number;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => props.$width}px;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES}px;
  opacity: ${(props) => (props.$active ? 1 : 0.2)};
`;

interface StyledPianoRollPatternBlockProps {
  $hovered: boolean;
  $isPlaying: boolean;
  $isFiltered: boolean;
}

export const StyledPianoRollPatternBlock = styled.div<StyledPianoRollPatternBlockProps>`
  width: ${PIANO_ROLL_CELL_SIZE * TRACKER_PATTERN_LENGTH}px;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES}px;
  overflow: hidden;
  transition:
    opacity 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  transition-delay: 0.1s;
  &:last-child {
    border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
    box-sizing: border-box;
  }

  ${(props) =>
    props.$isFiltered &&
    css`
      filter: grayscale(1);
    `}

  ${StyledPianoRollScrollCanvas}:hover & {
    opacity: 0.5;

    ${(props) =>
      props.$hovered &&
      !props.$isPlaying &&
      css`
        opacity: 1;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
      `}

    ${(props) =>
      props.$isPlaying &&
      css`
        opacity: 1;
      `}
  }

  @media (max-width: 840px) {
    opacity: 1;
    ${StyledPianoRollScrollCanvas} && {
      opacity: 1;
      box-shadow: none;
    }
  }
`;

interface StyledPatternChannelNotesProps {
  $active?: boolean;
}

export const StyledPatternChannelNotes = styled.div<StyledPatternChannelNotesProps>`
  position: absolute;
  top: 0;

  ${(props) => css`
    width: ${TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE}px;
    height: ${TOTAL_NOTES * PIANO_ROLL_CELL_SIZE}px;
    opacity: ${props.$active ? 1 : 0.2};
  `}

  ${(props) =>
    !props.$active &&
    css`
      ${StyledPianoRollNote} {
        border-color: transparent;
      }
    `}
`;

export const StyledPianoRollPatternBlockGrid = styled.div<{
  $size: "large" | "medium" | "small" | "sharp";
}>`
  position: absolute;
  top: 0;
  box-sizing: border-box;
  width: ${TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE}px;
  height: ${TOTAL_NOTES * PIANO_ROLL_CELL_SIZE}px;

  ${(props) =>
    props.$size === "large" &&
    css`
      background-image:
        linear-gradient(
          90deg,
          ${(props) => props.theme.colors.tracker.rollCell.border} 0,
          ${(props) => props.theme.colors.tracker.rollCell.border} 1px,
          transparent 1px,
          transparent ${PIANO_ROLL_CELL_SIZE * 8}px
        ),
        linear-gradient(
          0deg,
          ${(props) => props.theme.colors.tracker.rollCell.border} 0,
          ${(props) => props.theme.colors.tracker.rollCell.border} 1px,
          transparent 1px,
          transparent ${PIANO_ROLL_CELL_SIZE * 8}px
        );
      background-size: ${PIANO_ROLL_CELL_SIZE * 8}px
        ${PIANO_ROLL_CELL_SIZE * OCTAVE_SIZE}px;
    `}

  ${(props) =>
    props.$size === "medium" &&
    css`
      background-image:
        linear-gradient(
          90deg,
          ${(props) => props.theme.colors.tracker.rollCell.border} 0,
          ${(props) => props.theme.colors.tracker.rollCell.border} 1px,
          transparent 1px,
          transparent ${PIANO_ROLL_CELL_SIZE * 4}px
        ),
        linear-gradient(
          0deg,
          ${(props) => props.theme.colors.tracker.rollCell.border} 0,
          ${(props) => props.theme.colors.tracker.rollCell.border} 1px,
          transparent 1px,
          transparent ${PIANO_ROLL_CELL_SIZE * 4}px
        );
      background-size: ${PIANO_ROLL_CELL_SIZE * 4}px
        ${PIANO_ROLL_CELL_SIZE * OCTAVE_SIZE}px;
      opacity: 0.5;
    `}

  ${(props) =>
    props.$size === "small" &&
    css`
      background-image:
        linear-gradient(
          90deg,
          ${(props) => props.theme.colors.tracker.rollCell.border} 1px,
          transparent 1px
        ),
        linear-gradient(
          0deg,
          ${(props) => props.theme.colors.tracker.rollCell.border} 1px,
          transparent 1px
        );
      background-size: ${PIANO_ROLL_CELL_SIZE}px ${PIANO_ROLL_CELL_SIZE}px;
      opacity: 0.3;
    `}    


  ${(props) =>
    props.$size === "sharp" &&
    css`
      background-image: linear-gradient(
        0deg,
        transparent 0px,
        transparent ${PIANO_ROLL_CELL_SIZE}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 2}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 2}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 3}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 3}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 4}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 4}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 6}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 6}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 7}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 7}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 8}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 8}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 9}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 9}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 10}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 10}px,
        ${(props) => props.theme.colors.tracker.sharpBackground}
          ${PIANO_ROLL_CELL_SIZE * 11}px,
        transparent ${PIANO_ROLL_CELL_SIZE * 11}px
      );
      background-size: ${PIANO_ROLL_CELL_SIZE}px
        ${PIANO_ROLL_CELL_SIZE * OCTAVE_SIZE}px;
    `}    

  border-bottom: 1px solid
    ${(props) => props.theme.colors.tracker.rollCell.border};
  box-sizing: border-box;
`;

export const StyledPianoRollCrosshair = styled.div`
  position: absolute;
  top: 0;
  overflow: hidden;
  pointer-events: none;
  width: ${TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE}px;
  height: ${TOTAL_NOTES * PIANO_ROLL_CELL_SIZE}px;
  opacity: 0;
  ${StyledPianoRollScrollCanvas}:hover & {
    opacity: 1;
  }
`;

export const StyledPianoRollCrosshairHorizontal = styled.div`
  position: absolute;
  left: 0;
  background: ${(props) => props.theme.colors.tracker.rollCell.border};
  opacity: 0.3;
  width: 100%;
  height: ${PIANO_ROLL_CELL_SIZE}px;
`;

export const StyledPianoRollCrosshairVertical = styled.div`
  position: absolute;
  top: 0;
  background: ${(props) => props.theme.colors.tracker.rollCell.border};
  opacity: 0.3;
  width: ${PIANO_ROLL_CELL_SIZE}px;
  height: 100%;
`;

export const StyledAddPatternButton = styled.button`
  display: flex;
  color: ${(props) => props.theme.colors.panel.text};
  background: ${(props) => props.theme.colors.panel.background};
  border: 1px solid ${(props) => props.theme.colors.panel.border};
  border-radius: 4px;
  padding: 0;
  border-radius: 3px;
  width: 60px;
  height: 200px;
  align-items: center;
  justify-content: center;

  svg {
    fill: ${(props) => props.theme.colors.panel.icon};
    width: 20px;
    height: 20px;
    max-width: 20px;
    max-height: 20px;
  }

  &:hover {
    background: ${(props) => props.theme.colors.panel.hoverBackground};
  }

  &:active {
    background: ${(props) => props.theme.colors.panel.activeBackground};
  }
`;

export const StyledAddPatternWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: sticky;
  top: 40px;
  width: 100px;
`;
