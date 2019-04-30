import React, { Component } from "react";
import { Textarea } from "../library/Forms";
import { textNumLines } from "../../lib/helpers/trimlines";

const ScriptReviewLine = ({ scriptLine, onChange, ...props }) => (
  <div>
    <p style={{ color: "#999" }}>
      {scriptLine.actor.name
        ? scriptLine.actor.name
        : "Actor " + (scriptLine.actorIndex + 1)}{" "}
      — {scriptLine.scene.name}{" "}
      {(scriptLine.line.args.text || "")
        .split("\n")
        .map(
          (line, index, lines) =>
            `${line.length}/${index === lines.length - 1 ? 16 : 18}`
        )
        .join(", ")}
    </p>
    <Textarea
      fixedSize
      large
      borderless
      rows={textNumLines(scriptLine.line.args.text)}
      value={scriptLine.line.args.text}
      onChange={onChange}
    />
  </div>
);

export default ScriptReviewLine;
