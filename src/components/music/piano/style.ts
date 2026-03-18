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
import { patternHue } from "components/music/helpers";

export const StyledPianoRollWrapper = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  height: 100%;
`;

export const StyledPianoRollScrollWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
`;

export const StyledPianoRollScrollCanvas = styled.div`
  position: relative;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES}px;
`;

export const StyledPianoRollScrollLeftWrapper = styled.div`
  position: sticky;
  left: 0;
  width: ${PIANO_ROLL_PIANO_WIDTH}px;
  background: ${(props) => props.theme.colors.sidebar.background};
  z-index: 3;
  margin-bottom: -${PIANO_ROLL_FOOTER_HEIGHT + 1}px;

  &::before {
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
  }

  &::after {
    content: "";
    display: block;
    position: sticky;
    bottom: 0;
    width: ${PIANO_ROLL_PIANO_WIDTH + 1}px;
    height: ${PIANO_ROLL_FOOTER_HEIGHT + 1}px;
    background: ${(props) => props.theme.colors.sidebar.background};
    border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
    border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
    z-index: 20;
    box-sizing: border-box;
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
  width: 85%;
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
    background: linear-gradient(90deg, #607d8b 0%, #b0bec5);
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
  padding-right: 5px;
  position: relative;
  height: ${(props) => (props.$tall ? 2 : 1.5) * PIANO_ROLL_CELL_SIZE}px;
  width: 100%;
  background: white;
  border-bottom: 1px solid #cfd8dc;
  box-shadow: rgba(0, 0, 0, 0.1) -2px 0px 2px 0px inset;
  ${(props) => (props.$color === "black" ? blackKeyStyle : "")}
  ${(props) => (props.$highlight ? highlightStyle : "")}
  &:hover {
    ${highlightStyle};
  }
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

export const StyledPianoRollSequenceHeaderOrder = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};

  background-image: repeating-linear-gradient(
    90deg,
    transparent 0,
    transparent ${PIANO_ROLL_CELL_SIZE * 8 - 1}px,
    ${(props) => props.theme.colors.tracker.rollCell.border}
      ${PIANO_ROLL_CELL_SIZE * 8 - 1}px,
    ${(props) => props.theme.colors.tracker.rollCell.border}
      ${PIANO_ROLL_CELL_SIZE * 8}px,
    transparent ${PIANO_ROLL_CELL_SIZE * 8}px,
    transparent ${PIANO_ROLL_CELL_SIZE * 16 - 1}px,
    ${(props) => props.theme.colors.tracker.rollCell.border}
      ${PIANO_ROLL_CELL_SIZE * 16 - 1}px,
    ${(props) => props.theme.colors.tracker.rollCell.border}
      ${PIANO_ROLL_CELL_SIZE * 16}px,
    transparent ${PIANO_ROLL_CELL_SIZE * 16}px,
    transparent ${PIANO_ROLL_CELL_SIZE * 24 - 1}px,
    ${(props) => props.theme.colors.tracker.rollCell.border}
      ${PIANO_ROLL_CELL_SIZE * 24 - 1}px,
    ${(props) => props.theme.colors.tracker.rollCell.border}
      ${PIANO_ROLL_CELL_SIZE * 24}px,
    transparent ${PIANO_ROLL_CELL_SIZE * 24}px,
    transparent ${PIANO_ROLL_CELL_SIZE * 32}px
  );

  background-size: ${PIANO_ROLL_CELL_SIZE * 8 * 4}px 8px;
  background-repeat: repeat-x;
  background-position: 0px calc(100% - 2px);
`;

export const StyledPianoRollSequenceHeaderText = styled.div`
  position: sticky;
  left: 30px;
  padding: 0 5px;
`;

export const StyledPianoRollSequenceHeaderPattern = styled.div<{
  $patternIndex: number;
}>`
  flex-grow: 1;

  background: ${({ $patternIndex }) =>
    `linear-gradient(
      0deg,
      hsl(${patternHue($patternIndex)}deg 100% 70%) 0%,
      hsl(${patternHue($patternIndex)}deg 100% 80%) 100%
    )`};

  color: #000;

  display: flex;
  justify-content: center;
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
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 30%,
      rgba(255, 255, 255, 0.5) 50%,
      rgba(255, 255, 255, 0.1) 70%,
      rgba(255, 255, 255, 0) 100%
    );
    mix-blend-mode: overlay;
    width: 600%;
    height: 100%;
    display: flex;
    align-items: center;
    left: -250%;
  }
`;

interface StyledPianoRollNoteProps {
  $instrument?: number;
  $usingPreviousInstrument?: boolean;
  $isSelected?: boolean;
  $isDragging?: boolean;
  $isVirtual?: boolean;
}

export const StyledPianoRollNote = styled.div<StyledPianoRollNoteProps>`
  position: absolute;
  width: ${PIANO_ROLL_CELL_SIZE + 1}px;
  height: ${PIANO_ROLL_CELL_SIZE + 1}px;
  border: 1px solid black;
  box-sizing: border-box;
  text-align: center;
  line-height: 1.1em;
  pointer-events: none;
  background: ${(props) =>
    props.$instrument !== undefined
      ? `var(--instrument-${props.$instrument}-color)`
      : "black"};
  ${(props) =>
    props.$usingPreviousInstrument &&
    css`
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        var(--instrument-${props.$instrument}-color) 2px,
        var(--instrument-${props.$instrument}-color) 4px
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

interface StyledPianoRollEffectCellProps {
  $isSelected?: boolean;
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
  background: ${(props) => props.theme.colors.button.activeBackground};

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

interface StyledPianoRollPlayheadProps {
  $isPlaying: boolean;
}

export const StyledPianoRollPlayhead = styled.div<StyledPianoRollPlayheadProps>`
  pointer-events: none;
  z-index: 0;
  width: ${PIANO_ROLL_CELL_SIZE - 1}px;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES + PIANO_ROLL_CELL_SIZE}px;
  background-image: linear-gradient(
    90deg,
    ${(props) => props.theme.colors.highlight} 2px,
    transparent 1px
  );
  background-position-y: ${PIANO_ROLL_CELL_SIZE}px;
  background-repeat-y: no-repeat;
  background-size: ${PIANO_ROLL_CELL_SIZE * 8}px
    ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES + PIANO_ROLL_CELL_SIZE}px;
  position: absolute;
  top: 7px;
  bottom: 0;
  left: ${PIANO_ROLL_PIANO_WIDTH}px;

  ${(props) =>
    !props.$isPlaying &&
    css`
      transition: transform 0.2s linear;
    `}

  &:before {
    content: "";
    position: absolute;
    top: 2px;
    left: -${PIANO_ROLL_CELL_SIZE / 2 - 1}px;
    border-top: ${PIANO_ROLL_CELL_SIZE - 4}px solid transparent;
    border-top-color: ${(props) => props.theme.colors.highlight};
    border-left: ${PIANO_ROLL_CELL_SIZE / 2}px solid transparent;
    border-right: ${PIANO_ROLL_CELL_SIZE / 2}px solid transparent;
  }
`;

interface StyledPianoRollPatternBlockProps {
  $hovered: boolean;
  $isPlaying: boolean;
}

export const StyledPianoRollPatternBlock = styled.div<StyledPianoRollPatternBlockProps>`
  width: ${PIANO_ROLL_CELL_SIZE * TRACKER_PATTERN_LENGTH}px;
  height: ${PIANO_ROLL_CELL_SIZE * TOTAL_NOTES}px;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  &:last-child {
    border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
    box-sizing: border-box;
  }

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
  $size: "large" | "small";
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
          transparent 986px
        ),
        linear-gradient(
          0deg,
          ${(props) => props.theme.colors.tracker.rollCell.border} 0,
          ${(props) => props.theme.colors.tracker.rollCell.border} 1px,
          transparent 1px,
          transparent 986px
        );
      background-size: ${PIANO_ROLL_CELL_SIZE * 8}px
        ${PIANO_ROLL_CELL_SIZE * OCTAVE_SIZE}px;
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

export const StyledPianoRollPatternsWrapper = styled.div`
  display: flex;
`;
