import React, { Component } from "react";
import { Textarea } from "../library/Forms";
import trimlines, { textNumLines } from "../../lib/helpers/trimlines";
import l10n from "../../lib/helpers/l10n";

const ScriptReviewLine = ({ scriptLine, onChange, ...props }) => (
  <div>
    {Array.isArray(scriptLine.line.args.text) ? (
      scriptLine.line.args.text.map((text, textIndex) => (
        <div key={textIndex}>
          <p style={{ color: "#999" }}>
            {scriptLine.actor.name
              ? scriptLine.actor.name
              : "Actor " + (scriptLine.actorIndex + 1)}{" "}
            — {scriptLine.scene.name}{" "}
            {(text || "")
              .split("\n")
              .map(
                (line, index, lines) =>
                  `${line.length}/${index === 2 ? 16 : 18}`
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
                scriptLine.line.args.text.map((value, valueIndex) => {
                  if (valueIndex === textIndex) {
                    return trimlines(e.currentTarget.value);
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
          {scriptLine.actor.name
            ? scriptLine.actor.name
            : "Actor " + (scriptLine.actorIndex + 1)}{" "}
          — {scriptLine.scene.name}{" "}
          {(scriptLine.line.args.text || "")
            .split("\n")
            .map(
              (line, index, lines) => `${line.length}/${index === 2 ? 16 : 18}`
            )
            .join(", ")}
        </p>
        <Textarea
          fixedSize
          large
          borderless
          rows={textNumLines(scriptLine.line.args.text)}
          value={scriptLine.line.args.text}
          placeholder={l10n("FIELD_TEXT_PLACEHOLDER")}
          onChange={e => {
            onChange(trimlines(e.currentTarget.value));
          }}
        />
      </div>
    )}
  </div>
);

export default ScriptReviewLine;
