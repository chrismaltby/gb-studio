import React, { Component } from "react";
import { Textarea } from "../library/Forms";

const ScriptReviewLine = ({ scriptLine, onChange, ...props }) => (
  <div>
    <p style={{ color: "#999" }}>
      {scriptLine.actor.name
        ? scriptLine.actor.name
        : "Actor " + (scriptLine.actorIndex + 1)}{" "}
      — {scriptLine.scene.name}{" "}
      {(scriptLine.line.args.text || "")
        .split("\n")
        .map((line, index) => line.length + "/18")
        .join(", ")}
    </p>
    <Textarea
      fixedSize
      large
      borderless
      rows={2}
      value={scriptLine.line.args.text}
      onChange={onChange}
    />
  </div>
);

export default ScriptReviewLine;
