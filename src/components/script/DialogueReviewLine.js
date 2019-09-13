/* eslint-disable react/no-array-index-key */
import React from "react";
import PropTypes from "prop-types";
import { Textarea } from "../library/Forms";
import trimlines, { textNumLines } from "../../lib/helpers/trimlines";
import l10n from "../../lib/helpers/l10n";
import { SceneShape, ActorShape, EventShape } from "../../reducers/stateShape";

const DialogueReviewLine = ({ dialogueLine, onChange, ...props }) => {
  const maxPerLine = dialogueLine.line.args.avatarId ? 16 : 18;
  return (
    <div>
      {Array.isArray(dialogueLine.line.args.text) ? (
        dialogueLine.line.args.text.map((text, textIndex) => (
          <div key={textIndex}>
            <p style={{ color: "#999" }}>
              {dialogueLine.entityName} — {dialogueLine.sceneName}{" "}
              {(text || "")
                .split("\n")
                .map(
                  (line, index, lines) =>
                    `${line.length}/${index === 2 ? 16 : maxPerLine}`
                )
                .join(", ")}
            </p>
            <Textarea
              fixedSize
              large
              borderless
              rows={textNumLines(text)}
              value={text}
              placeholder={l10n("FIELD_TEXT_PLACEHOLDER")}
              onChange={e => {
                onChange(
                  dialogueLine.line.args.text.map((value, valueIndex) => {
                    if (valueIndex === textIndex) {
                      return trimlines(e.currentTarget.value, maxPerLine);
                    }
                    return value;
                  })
                );
              }}
            />
          </div>
        ))
      ) : (
        <div>
          <p style={{ color: "#999" }}>
            {dialogueLine.entityName} — {dialogueLine.sceneName}{" "}
            {(dialogueLine.line.args.text || "")
              .split("\n")
              .map(
                (line, index, lines) =>
                  `${line.length}/${index === 2 ? 16 : maxPerLine}`
              )
              .join(", ")}
          </p>
          <Textarea
            fixedSize
            large
            borderless
            rows={textNumLines(dialogueLine.line.args.text)}
            value={dialogueLine.line.args.text}
            placeholder={l10n("FIELD_TEXT_PLACEHOLDER")}
            onChange={e => {
              onChange(trimlines(e.currentTarget.value, maxPerLine));
            }}
          />
        </div>
      )}
    </div>
  );
};

DialogueReviewLine.propTypes = {
  dialogueLine: PropTypes.shape({
    scene: SceneShape,
    actor: ActorShape,
    entityName: PropTypes.string,
    entityIndex: PropTypes.number,
    line: EventShape
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default DialogueReviewLine;
