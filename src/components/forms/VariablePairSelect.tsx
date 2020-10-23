import React, { FC } from "react";
import VariableSelect from "./VariableSelect";

interface VariablePairSelectProps {
  id: string;
  value: string;
  entityId: string;
  onChange: (newValue: string) => void;
}

export const VariablePairSelect: FC<VariablePairSelectProps> = ({
  id,
  value,
  entityId,
  onChange,
}) => {
  const [hiValue = "0", loValue = "0"] = value.split(":");

  const onChangeHi = (e: any) => {
    onChange(`${e.value}:${loValue}`);
  };

  const onChangeLo = (e: any) => {
    onChange(`${hiValue}:${e.value}`);
  };

  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      <div style={{ paddingRight: 5 }}>hi</div>
      <div style={{ width: "50%" }}>
        <VariableSelect
          id={id}
          value={hiValue || "0"}
          entityId={entityId}
          onChange={onChangeHi}
          allowRename={false}
        />
      </div>
      <div style={{ padding: 5 }}>lo</div>
      <div style={{ width: "50%" }}>
        <VariableSelect
          id={id}
          value={loValue || "0"}
          entityId={entityId}
          onChange={onChangeLo}
          allowRename={false}
        />
      </div>
    </div>
  );
};
