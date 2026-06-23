import React from "react";
import { textNumLines } from "shared/lib/helpers/trimlines";
import l10n from "shared/lib/lang/l10n";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import { Textarea } from "ui/form/Textarea";

export interface DialogueLine {
  line: ScriptEventNormalized;
  sceneName: string;
  entityName: string;
  overrideActorId?: string;
  overrideTriggerId?: string;
}

interface DialogueReviewLineProps {
  dialogueLine: DialogueLine;
  onChange: (value: string | string[]) => void;
}

const DialogueReviewLine = ({
  dialogueLine,
  onChange,
}: DialogueReviewLineProps) => {
  return (
    <div>
      {dialogueLine.line.args && Array.isArray(dialogueLine.line.args.text) ? (
        dialogueLine.line.args.text.map((text, textIndex) => (
          <div key={textIndex}>
            <p style={{ color: "#999" }}>
              {dialogueLine.entityName} — {dialogueLine.sceneName} [
              {String(text || "")
                .split("\n")
                .map((line, _index, _lines) => `${line.length}`)
                .join(", ")}
              ]
            </p>
            <Textarea
              displaySize="large"
              rows={textNumLines(text)}
              value={text}
              placeholder={l10n("FIELD_TEXT_PLACEHOLDER")}
              onChange={(e) => {
                onChange(
                  dialogueLine.line.args &&
                    Array.isArray(dialogueLine.line.args.text)
                    ? dialogueLine.line.args.text.map((value, valueIndex) => {
                        if (valueIndex === textIndex) {
                          return e.currentTarget.value;
                        }
                        return value;
                      })
                    : "",
                );
              }}
            />
          </div>
        ))
      ) : (
        <div>
          <p style={{ color: "#999" }}>
            {dialogueLine.entityName} — {dialogueLine.sceneName} [
            {String(dialogueLine.line.args?.text || "")
              .split("\n")
              .map((line, _index, _lines) => `${line.length}`)
              .join(", ")}
            ]
          </p>
          <Textarea
            displaySize="large"
            rows={textNumLines(String(dialogueLine.line.args?.text))}
            value={String(dialogueLine.line.args?.text)}
            placeholder={l10n("FIELD_TEXT_PLACEHOLDER")}
            onChange={(e) => {
              onChange(e.currentTarget.value);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DialogueReviewLine;
