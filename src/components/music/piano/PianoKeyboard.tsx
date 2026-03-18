import React from "react";
import { StyledPianoKeyboard, StyledPianoKey } from "./style";
import { MAX_OCTAVE, TOTAL_OCTAVES } from "consts";

interface PianoKeyboardProps {
  hoverNote: number | null;
  c5Ref: React.RefObject<HTMLDivElement>;
}

const octaves = Array.from({ length: TOTAL_OCTAVES }, (_, i) => MAX_OCTAVE - i);

const notes = [
  "B",
  "A#",
  "A",
  "G#",
  "G",
  "F#",
  "F",
  "E",
  "D#",
  "D",
  "C#",
  "C",
] as const;

const blackNotes = ["A#", "G#", "F#", "D#", "C#"];
const tallNotes = ["A", "G", "D"];

export const PianoKeyboard = ({ hoverNote, c5Ref }: PianoKeyboardProps) => {
  return (
    <StyledPianoKeyboard>
      {octaves.map((octave) => {
        const base = (octave - 3) * 12;

        return (
          <React.Fragment key={`pianokey_${octave}`}>
            {notes.map((note, index) => {
              const offset = notes.length - 1 - index;
              const noteNumber = base + offset;
              const isBlack = blackNotes.includes(note);
              const isTall = tallNotes.includes(note);
              const isC = note === "C";
              const isC5 = isC && octave === 5;

              return (
                <StyledPianoKey
                  key={`${note}${octave}`}
                  $color={isBlack ? "black" : "white"}
                  $highlight={hoverNote === noteNumber}
                  $tall={isTall || undefined}
                  ref={isC5 ? c5Ref : undefined}
                  title={`${note}${octave}`}
                >
                  {isC ? `C${octave}` : undefined}
                </StyledPianoKey>
              );
            })}
          </React.Fragment>
        );
      })}
    </StyledPianoKeyboard>
  );
};
