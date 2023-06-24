import l10n from "lib/helpers/l10n";
import { SubPatternCell } from "lib/helpers/uge/song/SubPatternCell";
import React from "react";
import styled, { css } from "styled-components";
import { CheckboxField } from "ui/form/CheckboxField";
import { FormRow } from "ui/form/FormLayout";
import { renderEffect, renderEffectParam, renderNote } from "./helpers";

const SubpatternGrid = styled.div`
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;
`;

interface SubpatternRowProps {
  n: number;
  isActive: boolean;
  isPlaying: boolean;
  size?: "normal" | "small";
}

const SubpatternRow = styled.span<SubpatternRowProps>`
  display: inline-block;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.tracker.text};
  border-width: 0 1px 0 0;
  border-color: ${(props) => props.theme.colors.tracker.border};
  border-style: solid;
  margin: 0;
  padding: 4px 8px;
  height: 20px;
  ${(props) =>
    props.size === "small"
      ? css`
          width: 30px;
        `
      : css`
          width: 126px;
        `}
  background-color: ${(props) => props.theme.colors.tracker.background};
  ${(props) =>
    props.n % 8 === 0
      ? css`
          background-color: ${props.theme.colors.tracker.activeBackground};
        `
      : ""}
  ${(props) =>
    props.isActive
      ? css`
          background-color: ${props.theme.colors.tracker.activeBackground};
        `
      : ""}
  ${(props) =>
    props.isPlaying
      ? css`
          background-color: ${props.theme.colors.highlight};
        `
      : ""}
`;

const Field = styled.span<{ active?: boolean; selected?: boolean }>`
  :hover {
    box-shadow: 0px 0px 0px 2px rgba(255, 0, 0, 0.2) inset;
  }
  margin: 0;
  padding: 0 4px;
  ${(props) =>
    props.selected
      ? css`
          background-color: rgba(255, 0, 0, 0.2);
        `
      : ""}
  ${(props) =>
    props.active
      ? css`
          background-color: white;
        `
      : ""}
  ${(props) =>
    props.active && props.selected
      ? css`
          box-shadow: 0px 0px 0px 2px rgba(255, 0, 0, 0.2) inset;
        `
      : ""}
`;

const NoteField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.note};
  padding-right: 10px;
`;

const JumpField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.instrument};
`;

const EffectCodeField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.effectCode};
  padding-right: 1px;
`;

const EffectParamField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.effectParam};
  padding-left: 1px;
`;

interface InstrumentSubpatternEditorProps {
  enabled: boolean;
  subpattern: SubPatternCell[];
}

const renderCounter = (n: number): string => {
  return n?.toString().padStart(2, "0") || "__";
};

const renderJump = (n: number | null): string => {
  if (n === 0 || n === null) return "...";
  return `J${n.toString().padStart(2, "0")}`;
};

const renderOffset = (n: number | null): string => {
  if (n === null) return "...";
  if (n - 32 >= 0) return `+${(n - 32).toString().padStart(2, "0")}`;
  return `-${Math.abs(n - 32)
    .toString()
    .padStart(2, "0")}`;
};

export const InstrumentSubpatternEditor = ({
  enabled,
  subpattern,
}: InstrumentSubpatternEditorProps) => {
  const renderSubpattern = subpattern.slice(0, 32);

  return (
    <>
      <FormRow>
        <CheckboxField
          label={l10n("FIELD_SUBPATTERN_ENBALED")}
          name="length"
          checked={enabled}
        />
      </FormRow>

      {enabled ? (
        <SubpatternGrid>
          {renderSubpattern.map((s, i) => {
            return (
              <div style={{ display: "flex", flexDirection: "row" }}>
                <SubpatternRow
                  n={i}
                  size="small"
                  isActive={false}
                  isPlaying={false}
                >
                  <Field>{renderCounter(i)}</Field>
                </SubpatternRow>
                <SubpatternRow n={i} isActive={false} isPlaying={false}>
                  <NoteField>{renderOffset(s.note)}</NoteField>
                  <JumpField>{renderJump(s.jump)}</JumpField>
                  <EffectCodeField>
                    {renderEffect(s.effectcode)}
                  </EffectCodeField>
                  <EffectParamField>
                    {renderEffectParam(s.effectparam)}
                  </EffectParamField>
                </SubpatternRow>
              </div>
            );
          })}
        </SubpatternGrid>
      ) : (
        ""
      )}
    </>
  );
};
