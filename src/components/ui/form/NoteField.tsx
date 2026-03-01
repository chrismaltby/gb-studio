import React, { FC } from "react";
import l10n from "shared/lib/lang/l10n";
import { LabelColor } from "shared/lib/resources/types";
import styled, { css } from "styled-components";

export const noteColorStyles = css<{ $color?: LabelColor }>`
  ${({ $color }) =>
    $color &&
    css`
      --note-bg-color: var(--note-bg-color-${$color});
      --note-border-color: var(--note-border-color-${$color});
    `}
`;

const Wrapper = styled.div<{ $color?: LabelColor }>`
  position: relative;
  width: 100%;
  ${noteColorStyles}
`;

const ContentSize = styled.div`
  border: 1px solid transparent;
  box-sizing: border-box;
  display: inline-block;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 11px;
  font-stretch: 100%;
  font-style: normal;
  font-variant-caps: normal;
  font-variant-east-asian: normal;
  font-variant-ligatures: normal;
  font-variant-numeric: normal;
  font-weight: 400;
  letter-spacing: normal;
  line-height: normal;
  overflow-wrap: break-word;
  padding: 10px;
  text-rendering: auto;
  user-select: none;
  white-space: pre-wrap;
  word-spacing: 0px;
  min-height: 48px;
  opacity: 0;
`;

const Textarea = styled.textarea`
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--note-bg-color);
  border: 1px solid var(--note-border-color);
  border-radius: 4px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.2);
  padding: 10px;
  margin-bottom: 10px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 11px;
  resize: none;
  overflow: hidden;

  &:focus {
    box-shadow: 0 0 0px 2px var(--note-border-color) !important;
  }
`;

type NoteFieldProps = React.ComponentProps<typeof Textarea> & {
  color?: LabelColor;
};

export const NoteField: FC<NoteFieldProps> = (props) => {
  return (
    <Wrapper $color={props.color}>
      <ContentSize>{props.value} </ContentSize>
      <Textarea placeholder={`${l10n("FIELD_NOTES")}...`} {...props} />
    </Wrapper>
  );
};
