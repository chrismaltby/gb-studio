import React from "react";

interface ScriptEditorEventProps {
  id: string;
}

const ScriptEditorEvent = ({ id }: ScriptEditorEventProps) => {
  return (
    <div>
      <div style={{ background: "red" }}>Event: {id}</div>ABC
    </div>
  );
};

export default ScriptEditorEvent;
