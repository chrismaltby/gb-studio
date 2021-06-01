import React from "react";
import { useDispatch, useSelector } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import { FormField } from "../library/Forms";
import l10n from "lib/helpers/l10n";
import { SidebarHeading } from "./Sidebar";
import castEventValue from "lib/helpers/castEventValue";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import { customEventSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SidebarMultiColumnAuto, SidebarColumn } from "ui/sidebars/Sidebar";
import { FormContainer, FormHeader } from "ui/form/FormLayout";
import { EditableText } from "ui/form/EditableText";
import { RootState } from "store/configureStore";
import { CustomEvent } from "store/features/entities/entitiesTypes";

const customEventName = (customEvent: CustomEvent, customEventIndex: number) =>
  customEvent.name ? customEvent.name : `Script ${customEventIndex + 1}`;

const CustomEventEditor: React.FC<{id: string}> = ({id}) => {
  const customEvents = useSelector((state: RootState) => customEventSelectors.selectAll(state))
  const customEvent = useSelector((state: RootState) => customEventSelectors.selectById(state, id))
  const index = React.useMemo(() => customEvents.findIndex((p) => p.id === id), [customEvents, id]);

  const dispatch = useDispatch();

  const onEditVariableName = (key: string): React.ChangeEventHandler => (e) => {
    dispatch(entitiesActions.editCustomEvent({
      customEventId: customEvent!.id,
      changes: {
        variables: {
          ...customEvent!.variables,
          [key]: {
            ...customEvent!.variables[key]!,
            name: castEventValue(e),
          },
        },
      },
    }));
  };

  const onEditActorName = (key: string): React.ChangeEventHandler => (e) => {
    dispatch(entitiesActions.editCustomEvent({
      customEventId: customEvent!.id,
      changes: {
        actors: {
          ...customEvent!.actors,
          [key]: {
            ...customEvent!.actors[key]!,
            name: castEventValue(e),
          },
        },
      },
    }));
  };

  const onEdit = (key: string): React.ChangeEventHandler => e => {
    dispatch(entitiesActions.editCustomEvent({
      customEventId: customEvent!.id,
      changes: {
        [key]: castEventValue(e),
      },
    }));
  };

  const onRemove = React.useCallback(() => {
    dispatch(entitiesActions.removeCustomEvent({ customEventId: customEvent!.id }));
  }, [dispatch, customEvent]);

  const selectSidebar = () => dispatch(editorActions.selectSidebar());

  if (!customEvent) {
    return <WorldEditor />;
  }

  return (
    <SidebarMultiColumnAuto onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name"
              placeholder={customEventName(customEvent, index)}
              value={customEvent.name || ""}
              onChange={onEdit("name")}
            />
            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
            >
              <MenuItem onClick={onRemove}>
                {l10n("MENU_DELETE_CUSTOM_EVENT")}
              </MenuItem>
            </DropdownButton>
          </FormHeader>
          <FormField style={{}}>
            <label htmlFor="customEventDescription">
              {l10n("FIELD_DESCRIPTION")}
              <textarea
                id="customEventDescription"
                rows={3}
                value={customEvent.description || ""}
                placeholder={l10n(
                  "FIELD_CUSTOM_EVENT_DESCRIPTION_PLACEHOLDER"
                )}
                onChange={onEdit("description")}
              />
            </label>
          </FormField>
        </FormContainer>
        <div>
          <SidebarHeading title={l10n("SIDEBAR_PARAMETERS")} />
          <FormField style={{}}>
            <label>
              {`Variables: ${Object.values(customEvent.variables).length}/10`}
            </label>
          </FormField>
          {Object.values(customEvent.variables).map((variable, i) => {
            return (
              <FormField key={variable!.id} style={{}}>
                <input
                  id={`variable[${i}]`}
                  value={variable!.name}
                  placeholder="Variable Name"
                  onChange={onEditVariableName(variable!.id)}
                />
              </FormField>
            );
          })}
          <FormField style={{}}>
            <label>
              {`Actors: ${Object.values(customEvent.actors).length}/10`}
            </label>
          </FormField>
          {Object.values(customEvent.actors).map((actor, i) => {
            return (
              <FormField key={actor!.id} style={{}}>
                <input
                  id={`actor[${i}]`}
                  value={actor!.name}
                  placeholder="Actor Name"
                  onChange={onEditActorName(actor!.id)}
                />
              </FormField>
            );
          })}
        </div>
      </SidebarColumn>
      <SidebarColumn>
        <div>
          <SidebarHeading
            title={l10n("SIDEBAR_CUSTOM_EVENT_SCRIPT")}
            buttons={
              <ScriptEditorDropdownButton
                value={customEvent.script}
                onChange={onEdit("script")}
              />
            }
          />
          <ScriptEditor
            value={customEvent.script}
            type="customEvent"
            variables={Object.keys(customEvent.variables)}
            actors={Object.keys(customEvent.actors)}
            onChange={onEdit("script")}
            entityId={customEvent.id}
          />
        </div>
      </SidebarColumn>
    </SidebarMultiColumnAuto>
  );
}

export default CustomEventEditor;
