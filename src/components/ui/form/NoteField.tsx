import React, { FC } from "react";
import styled from "styled-components";
import l10n from "lib/helpers/l10n";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const ContentSize = styled.div`
  border: 1px solid transparent;
  box-sizing: border-box;
  display: inline-block;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
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

export const Textarea = styled.textarea`
  position: absolute;
  top: 0;
  left: 0;
  background-color: #bef0f3;
  border: 1px solid #61bae4;
  border-radius: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.2);
  padding: 10px;
  margin-bottom: 10px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 11px;
  resize: none;
  overflow: hidden;

  :focus {
    box-shadow: 0 0 0px 2px #2686b3 !important;
  }
`;

type NoteFieldProps = React.ComponentProps<typeof Textarea>;

export const NoteField: FC<NoteFieldProps> = (props) => {
  return (
    <Wrapper>
      <ContentSize>{props.value} </ContentSize>
      <Textarea placeholder={`${l10n("FIELD_NOTES")}...`} {...props} />
    </Wrapper>
  );
};
