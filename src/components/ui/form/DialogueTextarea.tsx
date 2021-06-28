import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { MentionsInput, SuggestionDataItem } from "react-mentions";
import { NamedVariable } from "lib/helpers/variables";
import keyBy from "lodash/keyBy";
import { Dictionary } from "@reduxjs/toolkit";
import { Font } from "store/features/entities/entitiesTypes";
import CustomMention from "./CustomMention";
import { RelativePortal } from "../layout/RelativePortal";
import { FontSelect } from "../../forms/FontSelect";
import { VariableSelect } from "../../forms/VariableSelect";
import { EditorSelectionType } from "store/features/editor/editorState";
import { TextSpeedSelect } from "../../forms/TextSpeedSelect";
import { SelectMenu, selectMenuStyleProps } from "./Select";
import l10n from "lib/helpers/l10n";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";

const varRegex = /\$([VLT0-9][0-9]*)\$/g;
const charRegex = /#([VLT0-9][0-9]*)#/g;
const speedRegex = /!(S[0-5]+)!/g;

const speedCodes = [
  {
    id: "S0",
    display: `${l10n("FIELD_INSTANT")}`,
  },
  {
    id: "S1",
    display: `${l10n("FIELD_SPEED")}\u00a01`,
  },
  {
    id: "S2",
    display: `${l10n("FIELD_SPEED")}\u00a02`,
  },
  {
    id: "S3",
    display: `${l10n("FIELD_SPEED")}\u00a03`,
  },
  {
    id: "S4",
    display: `${l10n("FIELD_SPEED")}\u00a04`,
  },
  {
    id: "S5",
    display: `${l10n("FIELD_SPEED")}\u00a05`,
  },
];

const speedCodeLookup = keyBy(speedCodes, "id");

const DialogueTextareaWrapper = styled.div`
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
    min-height: 38px;
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
    z-index: 100 !important;
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

  .Mentions__TokenChar {
    position: relative;
    z-index: 1;
    cursor: pointer;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.token.character};

    :hover {
      background: ${(props) => props.theme.colors.token.character};
      color: ${(props) => props.theme.colors.input.background};
    }
  }

  .Mentions__TokenSpeed {
    position: relative;
    z-index: 1;
    cursor: pointer;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.token.code};

    :hover {
      background: ${(props) => props.theme.colors.token.code};
      color: ${(props) => props.theme.colors.input.background};
    }
  }

  .Mentions__TokenFont {
    position: relative;
    z-index: 1;
    cursor: pointer;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.token.code};

    :hover {
      background: ${(props) => props.theme.colors.token.code};
      color: ${(props) => props.theme.colors.input.background};
    }
  }
`;

const searchVariables =
  (variables: NamedVariable[], wrapper: string) =>
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
        display: `${wrapper}${v.name}`,
      }));
  };

export interface DialogueTextareaProps {
  id?: string;
  value: string;
  placeholder?: string;
  variables: NamedVariable[];
  editorType: EditorSelectionType;
  entityId: string;
  fonts: Font[];
  maxlength?: number;
  onChange: (newValue: string) => void;
}

type EditModeOptions =
  | {
      type: "font" | "speed" | "var" | "char";
      id: string;
      index: number;
      x: number;
      y: number;
    }
  | undefined;

export const DialogueTextarea: FC<DialogueTextareaProps> = ({
  id,
  value,
  onChange,
  variables,
  fonts,
  entityId,
  placeholder,
}) => {
  const [variablesLookup, setVariablesLookup] = useState<
    Dictionary<NamedVariable>
  >({});
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [fontItems, setFontItems] = useState<SuggestionDataItem[]>([]);
  const [fontsLookup, setFontsLookup] = useState<
    Dictionary<SuggestionDataItem>
  >({});
  const [editMode, setEditMode] = useState<EditModeOptions>();
  const editorType = useSelector((state: RootState) => state.editor.type);

  useEffect(() => {
    setVariablesLookup(keyBy(variables, "code"));
  }, [variables]);

  useEffect(() => {
    const items = fonts.map((f) => ({
      id: `F:${f.id}`,
      display: `${l10n("FIELD_FONT")}: ${f.name}`,
    }));
    setFontItems(items);
    setFontsLookup(keyBy(items, "id"));
  }, [fonts]);

  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (e.target !== inputRef.current) {
      return;
    }
    // Override clipboard text
    // e.clipboardData?.setData("text/plain", "Replacement Text");
    // e.clipboardData?.setData("text/react-mentions", "Replacement Formatted Text");
  }, []);

  useEffect(() => {
    document.addEventListener("copy", handleCopy);
    return () => {
      document.removeEventListener("copy", handleCopy);
    };
  }, [handleCopy]);

  return (
    <DialogueTextareaWrapper>
      {editMode && (
        <RelativePortal
          offsetX={editMode.x}
          offsetY={editMode.y}
          pin="bottom-right"
          zIndex={10000}
        >
          <SelectMenu>
            {editMode.type === "font" && (
              <FontSelect
                name="replaceFont"
                value={editMode.id}
                onChange={(newId) => {
                  let matches = 0;
                  const newValue = value.replace(
                    /!(F:[0-9a-f-]+)!/g,
                    (match) => {
                      if (matches === editMode.index) {
                        matches++;
                        return `!F:${newId}!`;
                      }
                      matches++;
                      return match;
                    }
                  );
                  onChange(newValue);
                  setEditMode(undefined);
                }}
                onBlur={() => {
                  setEditMode(undefined);
                }}
                {...selectMenuStyleProps}
              />
            )}
            {(editMode.type === "var" || editMode.type === "char") && (
              <VariableSelect
                name="replaceVar"
                value={editMode.id}
                type="8bit"
                allowRename={false}
                entityId={entityId}
                onChange={(newId) => {
                  let matches = 0;
                  const newVar =
                    editorType === "customEvent"
                      ? `V${newId}`
                      : newId.padStart(2, "0");
                  const newValue = value.replace(
                    editMode.type === "var" ? varRegex : charRegex,
                    (match) => {
                      if (matches === editMode.index) {
                        matches++;
                        return editMode.type === "var"
                          ? `$${newVar}$`
                          : `#${newVar}#`;
                      }
                      matches++;
                      return match;
                    }
                  );
                  onChange(newValue);
                  setEditMode(undefined);
                }}
                onBlur={() => {
                  setEditMode(undefined);
                }}
                {...selectMenuStyleProps}
              />
            )}
            {editMode.type === "speed" && (
              <TextSpeedSelect
                name="replaceSpeed"
                value={parseInt(editMode.id || "0", 10)}
                onChange={(newId) => {
                  let matches = 0;
                  const newValue = value.replace(speedRegex, (match) => {
                    if (matches === editMode.index) {
                      matches++;
                      return `!S${newId}!`;
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
        className="MentionsInput"
        value={value}
        placeholder={placeholder}
        allowSuggestionsAboveCursor={true}
        onChange={(e: { target: { value: string } }) =>
          onChange(e.target.value)
        }
        inputRef={inputRef}
      >
        <CustomMention
          className="Mentions__TokenVar"
          trigger={/(\$([A-Za-z0-9]+))$/}
          markup="$__id__$"
          data={searchVariables(variables, "$")}
          regex={/\$([VLT0-9][0-9]*)\$/}
          displayTransform={(variable: string) =>
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
        <CustomMention
          className="Mentions__TokenChar"
          trigger={/(#([A-Za-z0-9]+))$/}
          markup="#__id__#"
          data={searchVariables(variables, "#")}
          regex={/#([VLT0-9][0-9]*)#/}
          displayTransform={(variable: string) =>
            "#" + (variablesLookup[variable]?.name || variable + "#")
          }
          hoverTransform={(variable) =>
            `${l10n("FIELD_CHARACTER")}: ${
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
              type: "char",
              id: id.replace(/^0/, ""),
              index,
              x: rect2.left - rect.left,
              y: rect2.top - rect.top,
            });
          }}
        />
        <CustomMention
          className="Mentions__TokenSpeed"
          trigger={/(!([A-Za-z0-9]+))$/}
          data={speedCodes}
          markup="!__id__!"
          regex={/!(S[0-5]+)!/}
          displayTransform={(_speedCode: string) => "Ｓ"}
          hoverTransform={(speedCode) =>
            speedCodeLookup[speedCode]?.display || ""
          }
          onClick={(e, id, index) => {
            const input = inputRef.current;
            if (!input) {
              return;
            }
            const rect = input.getBoundingClientRect();
            const rect2 = e.currentTarget.getBoundingClientRect();
            const speedId = id.replace(/^S/, "");
            setEditMode({
              type: "speed",
              id: speedId,
              index,
              x: rect2.left - rect.left,
              y: rect2.top - rect.top,
            });
          }}
        />
        <CustomMention
          className="Mentions__TokenFont"
          trigger={/(!([A-Za-z0-9]+))$/}
          data={fontItems}
          markup="!__id__!"
          regex={/!(F:[0-9a-f-]+)!/}
          displayTransform={(_fontCode) => {
            return "Ｆ";
          }}
          hoverTransform={(fontCode) => fontsLookup[fontCode]?.display || ""}
          onClick={(e, id, index) => {
            const input = inputRef.current;
            if (!input) {
              return;
            }
            const rect = input.getBoundingClientRect();
            const rect2 = e.currentTarget.getBoundingClientRect();
            const fontId = id.replace(/.*:/, "");
            setEditMode({
              type: "font",
              id: fontId,
              index,
              x: rect2.left - rect.left,
              y: rect2.top - rect.top,
            });
          }}
        />
      </MentionsInput>
    </DialogueTextareaWrapper>
  );
};
