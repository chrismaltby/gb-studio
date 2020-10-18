import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/configureStore";
import { EnginePropSchemaField } from "../../store/features/engine/engineState";
import { enginePropSelectors } from "../../store/features/entities/entitiesState";
import { FormField } from "../library/Forms";
import entitiesActions from "../../store/features/entities/entitiesActions";
import { Button } from "../ui/buttons/Button";
import l10n from "../../lib/helpers/l10n";
import uniq from "lodash/uniq";

const { editEngineProp, removeEngineProp } = entitiesActions;

export type EnginePropGroup = {
  name: string;
  fields: EnginePropSchemaField[];
};

const EnginePropsEditor = () => {
  const dispatch = useDispatch();
  const values = useSelector(enginePropSelectors.selectEntities);
  const fields = useSelector((state: RootState) => state.engine.fields);
  const [groupedFields, setGroupedFields] = useState<EnginePropGroup[]>([]);

  useEffect(() => {
    const groups = uniq(fields.map((f) => f.group));
    setGroupedFields(
      groups.map((g) => ({
        name: g,
        fields: fields.filter((f) => f.group === g),
      }))
    );
  }, [fields]);

  const resetToDefault = (fields: EnginePropSchemaField[]) => () => {
    fields.forEach((field) => {
      dispatch(
        removeEngineProp({
          enginePropId: field.key,
        })
      );
    });
  };

  return (
    <div>
      {groupedFields.map((group) => (
        <section>
          <h2>{l10n(group.name)}</h2>

          {group.fields.map((field) => (
            <FormField quarterWidth>
              <label>
                {l10n(field.label)}
                <input
                  value={values[field.key]?.value || ""}
                  placeholder={field.defaultValue}
                  onChange={(e) =>
                    dispatch(
                      editEngineProp({
                        enginePropId: field.key,
                        value: e.currentTarget.value,
                      })
                    )
                  }
                />
              </label>
            </FormField>
          ))}
          <div style={{ marginTop: 30 }}>
            <Button onClick={resetToDefault(group.fields)}>
              {l10n("FIELD_RESTORE_DEFAULT")}
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
};

export default EnginePropsEditor;
