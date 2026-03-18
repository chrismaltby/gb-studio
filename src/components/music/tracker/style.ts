import styled, { css } from "styled-components";
import { StyledButton, StyledButtonGroup } from "ui/buttons/style";

export const StyledTrackerWrapper = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
`;

export const StyledTrackerOrderSidebar = styled.div`
  width: 100px;
  flex-shrink: 0;
`;

export const StyledTrackerContentWrapper = styled.div`
  display: flex;
`;

export const StyledTrackerHeader = styled.div`
  display: flex;
  width: 100%;
  height: 30px;
  white-space: nowrap;
  box-shadow: 0 3px 5px rgb(0 0 0 / 20%);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
`;

export const StyledTrackerPattern = styled.div`
  overflow: auto;
  width: 100%;
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;

  &&& {
    box-shadow: none;
    z-index: 0;
  }
`;

export const StyledTrackerHeaderSpacer = styled.div`
  flex-grow: 1;
  background: rgba(0, 0, 0, 0.5);
  background: ${(props) => props.theme.colors.sidebar.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

interface StyledTrackerHeaderCellProps {
  $type: "channel" | "patternIndex" | "order";
  $muted?: boolean;
  $solo?: boolean;
}

export const StyledTrackerHeaderCell = styled.span<StyledTrackerHeaderCellProps>`
  position: relative;
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 10px;
  height: 30px;
  flex-shrink: 0;
  color: black;
  box-sizing: border-box;
  border-width: 0 1px 0 0;
  border-color: rgba(0, 0, 0, 0.1);
  border-style: solid;

  svg {
    fill: #000;
  }

  ${(props) =>
    props.$type === "patternIndex" &&
    css`
      width: 47px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    `}

  ${(props) =>
    props.$type === "channel" &&
    css`
      width: 133px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      &:nth-last-child(2) {
        border-right-color: ${(props) => props.theme.colors.tracker.border};
      }
    `}

  ${(props) =>
    props.$type === "order" &&
    css`
      width: 101px;
      background: ${(props) => props.theme.colors.sidebar.background};
      color: ${(props) => props.theme.colors.text};
      border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
      border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
    `}


  span {
    display: block;
    flex-grow: 1;
  }

  ${StyledButton} {
    background: transparent;
    border-color: rgba(0 0 0 / 0.3);
    border-color: transparent;
    color: #000;
  }

  ${StyledButtonGroup} {
    border-radius: 4px;
    box-shadow:
      2px 2px 3px rgba(0 0 0 / 30%),
      -2px -2px 3px rgba(255 255 255 / 30%);
  }

  ${StyledButton}:last-child {
    border-left-color: rgba(0 0 0 / 15%);
  }

  ${(props) =>
    props.$solo &&
    css`
      ${StyledButton}:first-child {
        background: ${props.theme.colors.highlight};
        color: ${props.theme.colors.highlightText};
        border-top-color: rgba(0 0 0 / 0.3);
        box-shadow: inset 1px 1px 3px rgba(0 0 0 / 25%);
        svg {
          fill: ${props.theme.colors.highlightText};
        }
      }
    `}

  ${(props) =>
    props.$muted &&
    css`
      ${StyledButton}:last-child {
        background: ${props.theme.colors.highlight};
        color: ${props.theme.colors.highlightText};
        border-top-color: rgba(0 0 0 / 0.3);
        box-shadow: inset 1px 1px 3px rgba(0 0 0 / 25%);
        svg {
          fill: ${props.theme.colors.highlightText};
        }
      }
    `}
`;

export const StyledTrackerRow = styled.div`
  display: flex;
`;

interface StyledTrackerCellProps {
  $n: number;
  $isActive: boolean;
  $isPlaying: boolean;
  $isMuted: boolean;
  $size?: "normal" | "small";
}

export const StyledTrackerCell = styled.div<StyledTrackerCellProps>`
  display: inline-flex;
  font-family: "Public Pixel", monospace;
  font-size: 12px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.tracker.text};
  border-width: 0 1px 0 0;
  border-color: ${(props) => props.theme.colors.tracker.border};
  border-style: solid;
  margin: 0;
  height: 25px;
  justify-content: center;
  align-items: center;

  ${(props) =>
    props.$size === "small"
      ? css`
          width: 46px;
          text-align: center;
        `
      : css`
          width: 132px;
        `}
  background-color: ${(props) => props.theme.colors.tracker.background};
  ${(props) =>
    props.$n % 8 === 0
      ? css`
          background-color: ${props.theme.colors.tracker.activeBackground};
        `
      : ""}
  ${(props) =>
    props.$isActive
      ? css`
          background-color: ${props.theme.colors.tracker.activeBackground};
        `
      : ""}
  ${(props) =>
    props.$isPlaying
      ? css`
          background-color: ${props.theme.colors.highlight};
          color: ${props.theme.colors.highlightText};
          ${StyledTrackerField} {
            color: ${props.theme.colors.highlightText};
          }
        `
      : ""}
  ${(props) =>
    props.$isMuted
      ? css`
          opacity: 0.3;
        `
      : ""}
`;

export const StyledTrackerField = styled.span<{
  $active?: boolean;
  $selected?: boolean;
}>`
  &:hover {
    box-shadow: 0px 0px 0px 2px rgba(255, 0, 0, 0.2) inset;
  }
  margin: 0;
  padding: 5px 4px;
  ${(props) =>
    props.$selected
      ? css`
          background-color: rgba(255, 0, 0, 0.2);
        `
      : ""}
  ${(props) =>
    props.$active
      ? css`
          background-color: white;
          && {
            color: black;
          }
        `
      : ""}
  ${(props) =>
    props.$active && props.$selected
      ? css`
          box-shadow: 0px 0px 0px 2px rgba(255, 0, 0, 0.2) inset;
        `
      : ""}
`;

export const StyledTrackerRowIndexField = styled.span`
  margin: 0;
  padding: 0 4px;
  pointer-events: none;
`;

export const StyledTrackerNoteField = styled(StyledTrackerField)`
  color: ${(props) => props.theme.colors.tracker.note};
`;

export const StyledTrackerInstrumentField = styled(StyledTrackerField)`
  color: ${(props) => props.theme.colors.tracker.instrument};
`;

export const StyledTrackerEffectCodeField = styled(StyledTrackerField)`
  color: ${(props) => props.theme.colors.tracker.effectCode};
`;

export const StyledTrackerEffectParamField = styled(StyledTrackerField)`
  color: ${(props) => props.theme.colors.tracker.effectParam};
`;
