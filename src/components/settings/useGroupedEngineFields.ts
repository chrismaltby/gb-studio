import uniq from "lodash/uniq";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { EngineFieldSchema } from "store/features/engine/engineState";

export type EngineFieldGroup = {
  name: string;
  sceneType?: string;
  searchMatches: string[];
  fields: EngineFieldSchema[];
};

export const useGroupedEngineFields = (sceneType?: string) => {
  const fields = useAppSelector((state) => state.engine.fields);
  const [groupedFields, setGroupedFields] = useState<EngineFieldGroup[]>([]);

  useEffect(() => {
    const groups = uniq(fields.map((f) => f.group));
    setGroupedFields(
      groups
        .map((g) => {
          const groupFields = fields.filter((f) => f.group === g);
          return {
            name: g,
            sceneType: groupFields[0].sceneType,
            searchMatches: ([] as string[]).concat(
              l10n(g as L10NKey),
              groupFields.map((field) => field.key),
              groupFields.map((field) => l10n(field.label as L10NKey)),
            ),
            fields: groupFields,
          };
        })
        .filter((g) => {
          return !sceneType || g.sceneType === sceneType;
        }),
    );
  }, [fields, sceneType]);

  return groupedFields;
};
