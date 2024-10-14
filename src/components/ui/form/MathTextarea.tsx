import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { MentionsInput, Mention, SuggestionDataItem } from "react-mentions";
import CustomMention from "./CustomMention";
import { NamedVariable } from "renderer/lib/variables";
import keyBy from "lodash/keyBy";
import debounce from "lodash/debounce";
import tokenize from "shared/lib/rpn/tokenizer";
import shuntingYard from "shared/lib/rpn/shuntingYard";
import { RelativePortal } from "ui/layout/RelativePortal";
import { SelectMenu, selectMenuStyleProps } from "./Select";
import { VariableSelect } from "components/forms/VariableSelect";
import l10n from "shared/lib/lang/l10n";
import { portalRoot } from "ui/layout/Portal";
import { ConstantSelect } from "components/forms/ConstantSelect";

const varRegex = /\$([VLT0-9][0-9]*)\$/g;
const constRegex = /@([a-z0-9-]{36})@/g;

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
  {
    id: "atan2(",
    display: "atan2(",
  },
  {
    id: "isqrt(",
    display: "isqrt(",
  },
  {
    id: "rnd(",
    display: "rnd(",
  },
];

const functionSearch = (search: string) => {
  return functionSymbols.filter((item) => item.display.indexOf(search) === 0);
};

const operatorSymbols = [
  {
    id: "<<",
    display: "<<",
  },
  {
    id: ">>",
    display: ">>",
  },
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

export const MathTextareaWrapper = styled.div`
  position: relative;
  z-index: 0;
  display: inline-block;
  width: 100%;
  min-width: 91px;
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
    font-size: ${(props) => props.theme.typography.fontSize};
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
    font-size: ${(props) => props.theme.typography.fontSize} !important;
    font-family: monospace !important;
    font-stretch: 100% !important;
    font-style: normal !important;
    font-variant-caps: normal !important;
    font-variant-east-asian: normal !important;
    font-variant-ligatures: normal !important;
    font-variant-numeric: normal !important;
    font-weight: 700 !important;
    border-radius: 4px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    line-height: 16px;
    font-family: monospace;
    padding: 5px;

    &:hover {
      background: ${(props) => props.theme.colors.input.hoverBackground};
    }

    &:focus {
      border: 1px solid ${(props) => props.theme.colors.highlight};
      background: ${(props) => props.theme.colors.input.activeBackground};
      z-index: 0;
    }
  }

  .Mentions__TokenVar {
    position: relative;
    z-index: 1;
    cursor: pointer;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.token.variable};

    &:hover {
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

  .Mentions__TokenConst {
    position: relative;
    z-index: 1;
    cursor: pointer;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.token.constant};

    :hover {
      background: ${(props) => props.theme.colors.token.constant};
      color: ${(props) => props.theme.colors.input.background};
    }
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

export type NamedConstant = {
  id: string;
  name: string;
};

export interface MathTextareaProps {
  id?: string;
  value: string;
  entityId: string;
  placeholder?: string;
  variables: NamedVariable[];
  constants: NamedConstant[];
  onChange: (newValue: string) => void;
}

type EditModeOptions =
  | {
      id: string;
      index: number;
      type: "variable" | "constant";
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
  constants,
  placeholder,
}) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [editMode, setEditMode] = useState<EditModeOptions>();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (inputRef.current) {
      // Remove spell check
      inputRef.current.spellcheck = false;
    }
  }, []);

  const variablesLookup = useMemo(() => keyBy(variables, "code"), [variables]);

  const debouncedEvaluate = useRef<(value: string) => void>(
    debounce((val) => {
      try {
        const tokens = tokenize(val);
        if (tokens.length > 0) {
          shuntingYard(tokens);
        }
        setError("");
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error(e.message);
          setError(e.message);
        } else {
          console.error(String(e));
        }
      }
    }, 300)
  );

  useEffect(() => debouncedEvaluate.current(value), [value]);

  const constantOptions = useMemo(() => {
    return constants.map((constant) => ({
      id: constant.id,
      display: constant.name,
    }));
  }, [constants]);

  const constantsLookup = useMemo(() => {
    return keyBy(constants, "id");
  }, [constants]);

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
            {editMode.type === "variable" && (
              <VariableSelect
                name="replaceVar"
                value={editMode.id}
                allowRename={false}
                entityId={entityId}
                onChange={(newId) => {
                  let matches = 0;
                  const newValue = value.replace(varRegex, (match) => {
                    if (matches === editMode.index) {
                      matches++;
                      return `$${newId.padStart(2, "0")}$`;
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
            {editMode.type === "constant" && (
              <ConstantSelect
                name="replaceConst"
                value={editMode.id}
                allowRename={false}
                onChange={(newId) => {
                  let matches = 0;
                  const newValue = value.replace(constRegex, (match) => {
                    if (matches === editMode.index) {
                      matches++;
                      return `@${newId}@`;
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
        suggestionsPortalHost={portalRoot}
      >
        <CustomMention
          className="Mentions__TokenVar"
          trigger={/(\$([\p{L}0-9]+))$/u}
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
              type: "variable",
              id: id.replace(/^0/, ""),
              index,
              x: rect2.left - rect.left,
              y: rect2.top - rect.top,
            });
          }}
          isLoading={false}
        />
        <Mention
          className="Mentions__TokenFun"
          trigger={/((m|mi|ma|ab|at)*)$/}
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
        <CustomMention
          className="Mentions__TokenConst"
          trigger={/(([A-Z0-9_][A-Z0-9_]+))$/u}
          markup="@__id__@"
          data={constantOptions}
          regex={/@([a-z0-9-]{36})@/}
          displayTransform={(constant) =>
            constantsLookup[constant]?.name || "0"
          }
          hoverTransform={(constant) =>
            `${l10n("FIELD_CONSTANT")}: ${
              constantsLookup[constant]?.name || "0"
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
              type: "constant",
              id,
              index,
              x: rect2.left - rect.left,
              y: rect2.top - rect.top,
            });
          }}
          isLoading={false}
        />
      </MentionsInput>
      {error.length > 0 && <MathError>{error}</MathError>}
    </MathTextareaWrapper>
  );
};
