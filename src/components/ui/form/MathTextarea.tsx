import React, { FC, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { MentionsInput, Mention, SuggestionDataItem } from "react-mentions";
import CustomMention from "./CustomMention";
import { NamedVariable } from "lib/helpers/variables";
import keyBy from "lodash/keyBy";
import { Dictionary } from "@reduxjs/toolkit";
import debounce from "lodash/debounce";
import tokenize from "lib/rpn/tokenizer";
import shuntingYard from "lib/rpn/shuntingYard";
import { RelativePortal } from "../layout/RelativePortal";
import { SelectMenu, selectMenuStyleProps } from "./Select";
import { VariableSelect } from "../../forms/VariableSelect";
import l10n from "lib/helpers/l10n";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";

const varRegex = /\$([VLT0-9][0-9]*)\$/g;

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

const functionSearch = (search: string) => {
  return functionSymbols.filter((item) => item.display.indexOf(search) === 0);
};

const operatorSymbols = [
  {
    id: "==",
    display: "==",
  },
  {
    id: "!=",
    display: "!=",
  },
  {
    id: "<=",
    display: "<=",
  },
  {
    id: "<",
    display: "<",
  },
  {
    id: ">=",
    display: ">=",
  },
  {
    id: ">",
    display: ">",
  },
  {
    id: "&&",
    display: "&&",
  },
  {
    id: "||",
    display: "||",
  },
  {
    id: "|",
    display: "|",
  },
  {
    id: "&",
    display: "&",
  },
  {
    id: "^",
    display: "^",
  },
  {
    id: "~",
    display: "~",
  },
  {
    id: "*",
    display: "*",
  },
  {
    id: "/",
    display: "/",
  },
  {
    id: "%",
    display: "%",
  },
  {
    id: "+",
    display: "+",
  },
  {
    id: "-",
    display: "-",
  },
];

const operatorSearch = (search: string) => {
  return operatorSymbols.filter((item) => item.display.indexOf(search) === 0);
};

const operatorRegex = new RegExp(
  "(" +
    operatorSymbols
      .map((op) =>
        op.id
          .replace(/\|/g, "\\|")
          .replace(/\^/g, "\\^")
          .replace(/\*/g, "\\*")
          .replace(/\+/g, "\\+")
      )
      .join("|") +
    ")"
);

const MathTextareaWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  font-size: ${(props) => props.theme.typography.fontSize};
  font-family: monospace;

  .MentionsInput {
    font-family: monospace;
  }

  .MentionsInput__control {
    color: ${(props) => props.theme.colors.input.text} !important;
    background: ${(props) => props.theme.colors.input.background};
    border-radius: 4px;
    padding: 5px;
    line-height: 16px;
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
    line-height: 16px;
    font-family: monospace;
    padding: 5px;

    :hover {
      background: ${(props) => props.theme.colors.input.hoverBackground};
    }

    :focus {
      border: 1px solid ${(props) => props.theme.colors.highlight};
      background: ${(props) => props.theme.colors.input.activeBackground};
      z-index: 0;
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
    position: relative;
    z-index: 1;
    cursor: pointer;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.token.variable};

    :hover {
      background: ${(props) => props.theme.colors.token.variable};
      color: ${(props) => props.theme.colors.input.background};
    }
  }

  .Mentions__TokenFun {
    color: ${(props) => props.theme.colors.token.function};
  }

  .Mentions__TokenOp {
    color: ${(props) => props.theme.colors.token.operator};
  }
`;

const MathError = styled.div`
  margin-top: 5px;
  padding: 0px;
  color: red;
`;

const searchVariables =
  (variables: NamedVariable[]) =>
  (query: string): SuggestionDataItem[] => {
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
  entityId: string;
  placeholder?: string;
  variables: NamedVariable[];
  onChange: (newValue: string) => void;
}

type EditModeOptions =
  | {
      type: "var";
      id: string;
      index: number;
      x: number;
      y: number;
    }
  | undefined;

export const MathTextarea: FC<MathTextareaProps> = ({
  id,
  value,
  onChange,
  entityId,
  variables,
  placeholder,
}) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const editorType = useSelector((state: RootState) => state.editor.type);
  const [variablesLookup, setVariablesLookup] = useState<
    Dictionary<NamedVariable>
  >({});
  const [editMode, setEditMode] = useState<EditModeOptions>();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setVariablesLookup(keyBy(variables, "code"));
  }, [variables]);

  const debouncedEvalutate = useRef<(value: string) => void>(
    debounce((val) => {
      try {
        const tokens = tokenize(val);
        if (tokens.length > 0) {
          shuntingYard(tokens);
        }
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
      {editMode && (
        <RelativePortal
          offsetX={editMode.x}
          offsetY={editMode.y}
          pin="bottom-right"
          zIndex={10000}
        >
          <SelectMenu>
            {editMode.type === "var" && (
              <VariableSelect
                name="replaceVar"
                value={editMode.id}
                type="8bit"
                allowRename={false}
                entityId={entityId}
                onChange={(newId) => {
                  let matches = 0;
                  const newValue = value.replace(varRegex, (match) => {
                    if (matches === editMode.index) {
                      matches++;
                      if (editorType !== "customEvent") {
                        return editMode.type === "var"
                          ? `$${newId.padStart(2, "0")}$`
                          : `#${newId.padStart(2, "0")}#`;
                      } else {
                        return editMode.type === "var"
                          ? `$V${newId}$`
                          : `#V${newId}#`;
                      }
                    }
                    matches++;
                    return match;
                  });
                  onChange(newValue);
                  setEditMode(undefined);
                }}
                onBlur={() => {
                  setEditMode(undefined);
                }}
                {...selectMenuStyleProps}
              />
            )}
          </SelectMenu>
        </RelativePortal>
      )}
      <MentionsInput
        id={id}
        inputRef={inputRef}
        className="MentionsInput"
        value={value}
        placeholder={placeholder}
        allowSuggestionsAboveCursor={true}
        onChange={(e) => onChange(e.target.value)}
      >
        <CustomMention
          className="Mentions__TokenVar"
          trigger={/(\$([A-Za-z0-9]+))$/}
          markup="$__id__$"
          data={searchVariables(variables)}
          regex={/\$([VLT0-9][0-9]*)\$/}
          displayTransform={(variable) =>
            "$" + (variablesLookup[variable]?.name || variable + "$")
          }
          hoverTransform={(variable) =>
            `${l10n("FIELD_VARIABLE")}: ${
              variablesLookup[variable]?.name || variable
            }`
          }
          onClick={(e, id, index) => {
            const input = inputRef.current;
            if (!input) {
              return;
            }
            const rect = input.getBoundingClientRect();
            const rect2 = e.currentTarget.getBoundingClientRect();
            setEditMode({
              type: "var",
              id: id.replace(/^0/, ""),
              index,
              x: rect2.left - rect.left,
              y: rect2.top - rect.top,
            });
          }}
        />
        <Mention
          className="Mentions__TokenFun"
          trigger={/((m|mi|ma|ab)*)$/}
          data={functionSearch}
          markup="__id__)"
          regex={/(min|max|abs)/}
        />
        <Mention
          className="Mentions__TokenOp"
          trigger={/±$^/}
          data={operatorSearch}
          markup="__id__"
          regex={operatorRegex}
        />
      </MentionsInput>
      {error.length > 0 && <MathError>{error}</MathError>}
    </MathTextareaWrapper>
  );
};
