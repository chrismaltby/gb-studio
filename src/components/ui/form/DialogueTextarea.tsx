import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { MentionsInput, SuggestionDataItem } from "react-mentions";
import { NamedVariable } from "renderer/lib/variables";
import keyBy from "lodash/keyBy";
import { Dictionary } from "@reduxjs/toolkit";
import { Font } from "shared/lib/entities/entitiesTypes";
import CustomMention from "./CustomMention";
import { RelativePortal } from "ui/layout/RelativePortal";
import { FontSelect } from "components/forms/FontSelect";
import { VariableSelect } from "components/forms/VariableSelect";
import { TextSpeedSelect } from "components/forms/TextSpeedSelect";
import { SelectMenu, selectMenuStyleProps } from "./Select";
import l10n from "shared/lib/lang/l10n";
import { portalRoot } from "ui/layout/Portal";
import { TextGotoSelect } from "components/forms/TextGotoSelect";
import { decOct, fromSigned8Bit } from "shared/lib/helpers/8bit";
import { ensureNumber } from "shared/types";

const varRegex = /\$([VLT0-9][0-9]*)\$/g;
const charRegex = /#([VLT0-9][0-9]*)#/g;
const speedRegex = /!(S[0-5]+)!/g;
const gotoRegex = /(\\00[34]\\[0-7][0-7][0-7]\\[0-7][0-7][0-7])/g;

interface DialogueTextareaWrapperProps {
  singleLine?: boolean;
}

const DialogueTextareaWrapper = styled.div<DialogueTextareaWrapperProps>`
  position: relative;
  z-index: 0;
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
    ${(props) => (!props.singleLine ? `min-height: 38px;` : "")}
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

  .Mentions__TokenGoto {
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

const extractGotoCoords = (code: string): [number, number] => {
  const coords = code.split("\\");
  const offsetX = fromSigned8Bit(parseInt(coords[2], 8));
  const offsetY = fromSigned8Bit(parseInt(coords[3], 8));
  return [
    offsetX >= 0 ? offsetX - 1 : offsetX,
    offsetY >= 0 ? offsetY - 1 : offsetY,
  ];
};

export interface DialogueTextareaProps {
  id?: string;
  value: string;
  placeholder?: string;
  variables: NamedVariable[];
  entityId: string;
  fonts: Font[];
  maxlength?: number;
  singleLine?: boolean;
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
  | {
      type: "goto";
      id: string;
      index: number;
      offsetX: number;
      offsetY: number;
      relative: boolean;
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
  singleLine = false,
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

  const speedCodes = useMemo(
    () => [
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
    ],
    []
  );

  const speedCodeLookup = useMemo(() => keyBy(speedCodes, "id"), [speedCodes]);

  const moveCodes = useMemo(
    () => [
      {
        id: "\\003\\001\\001",
        display: l10n("FIELD_SET_CURSOR_POSITION_TO"),
      },
      {
        id: "\\004\\002\\002",
        display: l10n("FIELD_MOVE_CURSOR_POSITION_BY"),
      },
    ],
    []
  );

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
    <DialogueTextareaWrapper singleLine={singleLine}>
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
                allowRename={false}
                entityId={entityId}
                onChange={(newId) => {
                  let matches = 0;
                  const newVar = newId.padStart(2, "0");
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
            {editMode.type === "goto" && (
              <TextGotoSelect
                value={editMode}
                onChange={(newGoto) => {
                  let matches = 0;
                  const newValue = value.replace(gotoRegex, (match) => {
                    if (matches === editMode.index) {
                      matches++;
                      const newX =
                        newGoto.offsetX >= 0
                          ? newGoto.offsetX + 1
                          : newGoto.offsetX;
                      const newY =
                        newGoto.offsetY >= 0
                          ? newGoto.offsetY + 1
                          : newGoto.offsetY;
                      return `\\00${newGoto.relative ? "4" : "3"}\\${decOct(
                        fromSigned8Bit(ensureNumber(newX, 1))
                      ).padStart(3, "0")}\\${decOct(
                        fromSigned8Bit(ensureNumber(newY, 1))
                      )}`;
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
              />
            )}
          </SelectMenu>
        </RelativePortal>
      )}
      <MentionsInput
        id={id}
        singleLine={singleLine}
        className="MentionsInput"
        value={value}
        placeholder={placeholder}
        allowSuggestionsAboveCursor={true}
        onChange={(e: { target: { value: string } }) =>
          onChange(e.target.value)
        }
        inputRef={inputRef}
        suggestionsPortalHost={portalRoot}
      >
        <CustomMention
          className="Mentions__TokenVar"
          trigger={/(\$([\p{L}0-9]+))$/u}
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
          trigger={/(#([\p{L}0-9]+))$/u}
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
          trigger={/(!([\p{L}0-9]+))$/u}
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
          trigger={/(!([\p{L}0-9]+))$/u}
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
        <CustomMention
          className="Mentions__TokenGoto"
          trigger={/(!([\p{L}0-9]+))$/u}
          data={moveCodes}
          markup={`__id__`}
          regex={/(\\00[34]\\[0-7][0-7][0-7]\\[0-7][0-7][0-7])/}
          displayTransform={(code: string) => {
            const [offsetX, offsetY] = extractGotoCoords(code);
            return `${code[3] === "3" ? "Ｐ" : "Ｍ"}(${
              code[3] === "3" || offsetX < 0 ? offsetX : `+${offsetX}`
            },${code[3] === "3" || offsetY < 0 ? offsetY : `+${offsetY}`})`;
          }}
          hoverTransform={(code) =>
            code[3] === "3"
              ? l10n("FIELD_SET_CURSOR_POSITION_TO")
              : l10n("FIELD_MOVE_CURSOR_POSITION_BY")
          }
          onClick={(e, code, index) => {
            const input = inputRef.current;
            if (!input) {
              return;
            }
            const rect = input.getBoundingClientRect();
            const rect2 = e.currentTarget.getBoundingClientRect();
            const [offsetX, offsetY] = extractGotoCoords(code);
            setEditMode({
              type: "goto",
              id: code,
              offsetX,
              offsetY,
              relative: code[3] === "4",
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
