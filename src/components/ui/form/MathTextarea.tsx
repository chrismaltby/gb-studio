import React, { FC, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { MentionsInput, Mention, SuggestionDataItem } from "react-mentions";
import { NamedVariable } from "../../../lib/helpers/variables";
import keyBy from "lodash/keyBy";
import { Dictionary } from "@reduxjs/toolkit";
import debounce from "lodash/debounce";
import tokenize from "../../../lib/rpn/tokenizer";
import shuntingYard from "../../../lib/rpn/shuntingYard";

const functionSymbols = [
  {
    id: "abs(",
    display: "abs(",
  },
  {
    id: "min(",
    display: "min(",
  },
  {
    id: "max(",
    display: "max(",
  },
];

const MathTextareaWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;

  .MentionsInput {
    font-family: monospace;
  }

  .MentionsInput__control {
    color: ${(props) => props.theme.colors.input.text} !important;
    background: ${(props) => props.theme.colors.input.background};
    border-radius: 4px;
    padding: 5px;
    // min-height: 74px;
    line-height: 18px;
  }

  .MentionsInput__highlighter {
    color: ${(props) => props.theme.colors.input.text} !important;
    font-family: monospace;
    font-size: 12px;
    font-stretch: 100%;
    font-style: normal;
    font-variant-caps: normal;
    font-variant-east-asian: normal;
    font-variant-ligatures: normal;
    font-variant-numeric: normal;
    font-weight: 700;
  }

  .MentionsInput__highlighter__substring {
    visibility: visible !important;
  }

  .MentionsInput__input {
    color: transparent;
    border: 1px solid ${(props) => props.theme.colors.input.border};
    font-size: ${(props) => props.theme.typography.fontSize};
    border-radius: 4px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    line-height: 18px;
    font-family: monospace;

    :hover {
      background: ${(props) => props.theme.colors.input.hoverBackground};
    }

    :focus {
      border: 1px solid ${(props) => props.theme.colors.highlight};
      background: ${(props) => props.theme.colors.input.activeBackground};
    }
  }

  .MentionsInput__suggestions {
    background-color: transparent !important;
    z-index: 10000 !important;
  }

  .MentionsInput__suggestions__list {
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    width: max-content;
    min-width: 100px;
    user-select: none;
    box-shadow: 0 0 0 1px rgba(150, 150, 150, 0.3),
      0 4px 11px hsla(0, 0%, 0%, 0.1);
    background: ${(props) => props.theme.colors.menu.background};
    color: ${(props) => props.theme.colors.text};
    font-size: ${(props) => props.theme.typography.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
      "Segoe UI Symbol";
    padding: 4px 0;
  }

  .MentionsInput__suggestions__item {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    &:focus {
      background: ${(props) => props.theme.colors.menu.hoverBackground};
      outline: none;
      box-shadow: none;
    }
  }

  .MentionsInput__suggestions__item:hover {
    background-color: ${(props) => props.theme.colors.menu.hoverBackground};
  }

  .MentionsInput__suggestions__item--focused {
    background-color: ${(props) => props.theme.colors.menu.activeBackground};
  }

  .Mentions__TokenVar {
    color: ${(props) => props.theme.colors.token.variable};
  }

  .Mentions__TokenFun {
    color: ${(props) => props.theme.colors.token.speed};
  }
`;

const MathError = styled.div`
  margin-top: 5px;
  padding: 0px;
  color: red;
`;

const searchVariables = (variables: NamedVariable[], wrapper: string) => (
  query: string
): SuggestionDataItem[] => {
  const upperSearch = query.toUpperCase();
  return variables
    .filter(
      (v) =>
        v.code.indexOf(upperSearch) > -1 ||
        v.name.toUpperCase().indexOf(upperSearch) > -1
    )
    .slice(0, 5)
    .map((v) => ({
      id: v.code,
      display: `$${v.name}`,
    }));
};

export interface MathTextareaProps {
  id?: string;
  value: string;
  placeholder?: string;
  variables: NamedVariable[];
  onChange: (newValue: string) => void;
}

export const MathTextarea: FC<MathTextareaProps> = ({
  id,
  value,
  onChange,
  variables,
  placeholder,
}) => {
  const [variablesLookup, setVariablesLookup] = useState<
    Dictionary<NamedVariable>
  >({});

  const [error, setError] = useState<string>("");

  useEffect(() => {
    setVariablesLookup(keyBy(variables, "code"));
  }, [variables]);

  const debouncedEvalutate = useRef<(value: string) => void>(
    debounce((val) => {
      try {
        const tokens = tokenize(val);
        shuntingYard(tokens);
        setError("");
      } catch (e) {
        console.error(e.message);
        setError(e.message);
      }
    }, 300)
  );

  useEffect(() => debouncedEvalutate.current(value), [value]);

  return (
    <MathTextareaWrapper>
      <MentionsInput
        id={id}
        className="MentionsInput"
        value={value}
        placeholder={placeholder}
        allowSuggestionsAboveCursor={true}
        onChange={(e: any) => onChange(e.target.value)}
      >
        <Mention
          className="Mentions__TokenVar"
          trigger={/(\$([A-Za-z0-9]+))$/}
          markup="$__id__$"
          data={searchVariables(variables, "$")}
          regex={/\$([VLT0-9][0-9]*)\$/}
          displayTransform={(variable) =>
            "$" + (variablesLookup[variable]?.name || variable + "$")
          }
        />
        <Mention
          className="Mentions__TokenFun"
          trigger={/((m|a)[a-z]*)$/}
          data={functionSymbols}
          markup="__id__)"
          regex={/(min|max|abs)/}
        />
      </MentionsInput>
      {error.length > 0 && <MathError>{error}</MathError>}
    </MathTextareaWrapper>
  );
};
