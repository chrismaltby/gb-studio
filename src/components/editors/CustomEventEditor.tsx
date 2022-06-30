import React, { useCallback, useState } from "react";
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
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
} from "ui/form/FormLayout";
import { EditableText } from "ui/form/EditableText";
import { RootState } from "store/configureStore";
import { CustomEvent } from "store/features/entities/entitiesTypes";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { LockIcon, LockOpenIcon, AsteriskIcon } from "ui/icons/Icons";
import { CustomEventSymbolsEditor } from "components/forms/symbols/CustomEventSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { Checkbox } from "ui/form/Checkbox";
import { FlexRow } from "ui/spacing/Spacing";
import { NoteField } from "ui/form/NoteField";
import styled from "styled-components";

const PassByReferenceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 15px;
  margin-right: 10px;
  margin-top: 10px;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const customEventName = (customEvent: CustomEvent, customEventIndex: number) =>
  customEvent.name ? customEvent.name : `Script ${customEventIndex + 1}`;

interface CustomEventEditorProps {
  id: string;
  multiColumn: boolean;
}

const scriptTabs = {
  script: l10n("SIDEBAR_CUSTOM_EVENT_SCRIPT"),
} as const;

const CustomEventEditor = ({ id, multiColumn }: CustomEventEditorProps) => {
  const customEvents = useSelector((state: RootState) =>
    customEventSelectors.selectAll(state)
  );
  const customEvent = useSelector((state: RootState) =>
    customEventSelectors.selectById(state, id)
  );
  const index = React.useMemo(
    () => customEvents.findIndex((p) => p.id === id),
    [customEvents, id]
  );
  const lockScriptEditor = useSelector(
    (state: RootState) => state.editor.lockScriptEditor
  );

  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useDispatch();

  const onEditVariableName =
    (key: string): React.ChangeEventHandler =>
    (e) => {
      if (!customEvent) {
        return;
      }
      const variable = customEvent.variables[key];
      if (!variable) {
        return;
      }

      dispatch(
        entitiesActions.editCustomEvent({
          customEventId: customEvent.id,
          changes: {
            variables: Object.assign({}, customEvent.variables, {
              [key]: {
                ...variable,
                name: castEventValue(e),
              },
            }),
          },
        })
      );
    };

  const onEditActorName =
    (key: string): React.ChangeEventHandler =>
    (e) => {
      if (!customEvent) {
        return;
      }
      const actor = customEvent.actors[key];
      if (!actor) {
        return;
      }

      dispatch(
        entitiesActions.editCustomEvent({
          customEventId: customEvent.id,
          changes: {
            actors: Object.assign({}, customEvent.actors, {
              [key]: {
                ...actor,
                name: castEventValue(e),
              },
            }),
          },
        })
      );
    };

  const onEdit =
    (key: string): React.ChangeEventHandler =>
    (e) => {
      if (!customEvent) {
        return;
      }
      dispatch(
        entitiesActions.editCustomEvent({
          customEventId: customEvent.id,
          changes: {
            [key]: castEventValue(e),
          },
        })
      );
    };

  const onRemove = React.useCallback(() => {
    if (!customEvent) {
      return;
    }
    dispatch(
      entitiesActions.removeCustomEvent({ customEventId: customEvent.id })
    );
  }, [dispatch, customEvent]);

  const onToggleLockScriptEditor = useCallback(() => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  }, [dispatch, lockScriptEditor]);

  const selectSidebar = () => dispatch(editorActions.selectSidebar());

  if (!customEvent) {
    return <WorldEditor />;
  }

  const lockButton = (
    <Button
      size="small"
      variant={lockScriptEditor ? "primary" : "transparent"}
      onClick={onToggleLockScriptEditor}
      title={
        lockScriptEditor
          ? l10n("FIELD_UNLOCK_SCRIPT_EDITOR")
          : l10n("FIELD_LOCK_SCRIPT_EDITOR")
      }
    >
      {lockScriptEditor ? <LockIcon /> : <LockOpenIcon />}
    </Button>
  );

  const scriptButton = (
    <ScriptEditorDropdownButton
      value={customEvent.script}
      type="customEvent"
      entityId={customEvent.id}
      scriptKey={"script"}
    />
  );

  return (
    <Sidebar onClick={selectSidebar} multiColumn={multiColumn}>
      {!lockScriptEditor && (
        <SidebarColumn style={{ maxWidth: multiColumn ? 300 : undefined }}>
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
                {!showSymbols && (
                  <MenuItem onClick={() => setShowSymbols(true)}>
                    {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
                  </MenuItem>
                )}
                <MenuItem onClick={onRemove}>
                  {l10n("MENU_DELETE_CUSTOM_EVENT")}
                </MenuItem>
              </DropdownButton>
            </FormHeader>

            {showSymbols && (
              <>
                <SymbolEditorWrapper>
                  <CustomEventSymbolsEditor id={customEvent.id} />
                </SymbolEditorWrapper>
                <FormDivider />
              </>
            )}

            <FormRow>
              <NoteField
                autofocus
                value={customEvent.description || ""}
                onChange={onEdit("description")}
              />
            </FormRow>
          </FormContainer>
          <div>
            <SidebarHeading title={l10n("SIDEBAR_PARAMETERS")} />
            <div style={{ display: "flex" }}>
              <FormField style={{}}>
                <label>
                  <strong>{l10n("FIELD_VARIABLES")}:</strong>{" "}
                  {`${Object.values(customEvent.variables).length}/10`}
                </label>
              </FormField>
              <PassByReferenceHeader
                title={l10n("FIELD_PASS_BY_REFERENCE_HEADER_TITLE")}
              >
                <AsteriskIcon />
              </PassByReferenceHeader>
            </div>
            {Object.values(customEvent.variables).map((variable, i) => {
              if (!variable) {
                return null;
              }
              return (
                <FormField key={variable.id} style={{}}>
                  <FlexRow>
                    <input
                      id={`variable[${i}]`}
                      value={variable.name}
                      placeholder="Variable Name"
                      onChange={onEditVariableName(variable.id)}
                    />
                    <div style={{ marginTop: 2 }}>
                      <Checkbox
                        id={`variable[${i}].value`}
                        name="passByValue"
                        checked
                      />
                    </div>
                  </FlexRow>
                </FormField>
              );
            })}
            <FormField style={{}}>
              <label>
                <strong>{l10n("FIELD_ACTORS")}:</strong>{" "}
                {`${Object.values(customEvent.actors).length}/10`}
              </label>
            </FormField>
            {Object.values(customEvent.actors).map((actor, i) => {
              if (!actor) {
                return null;
              }
              return (
                <FormField key={actor.id} style={{}}>
                  <input
                    id={`actor[${i}]`}
                    value={actor.name}
                    placeholder="Actor Name"
                    onChange={onEditActorName(actor.id)}
                  />
                </FormField>
              );
            })}
          </div>
        </SidebarColumn>
      )}
      <SidebarColumn>
        <StickyTabs>
          <TabBar
            values={scriptTabs}
            buttons={
              <>
                {lockButton}
                {scriptButton}
              </>
            }
          />
        </StickyTabs>
        <ScriptEditor
          value={customEvent.script}
          type="customEvent"
          entityId={customEvent.id}
          scriptKey={"script"}
        />
      </SidebarColumn>
    </Sidebar>
  );
};

export default CustomEventEditor;
