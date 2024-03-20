import React, { useCallback, useMemo, useState } from "react";
import ScriptEditor from "components/script/ScriptEditor";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
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
import { CustomEventNormalized } from "shared/lib/entities/entitiesTypes";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";
import { CustomEventSymbolsEditor } from "components/forms/symbols/CustomEventSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { Checkbox } from "ui/form/Checkbox";
import { NoteField } from "ui/form/NoteField";
import { InputGroup, InputGroupAppend } from "ui/form/InputGroup";
import { Input } from "ui/form/Input";
import { SidebarHeader } from "ui/form/SidebarHeader";
import { Label } from "ui/form/Label";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ScriptEditorCtx } from "shared/lib/scripts/context";

const customEventName = (
  customEvent: CustomEventNormalized,
  customEventIndex: number
) => (customEvent.name ? customEvent.name : `Script ${customEventIndex + 1}`);

interface CustomEventEditorProps {
  id: string;
  multiColumn: boolean;
}

const CustomEventEditor = ({ id, multiColumn }: CustomEventEditorProps) => {
  const customEvents = useAppSelector((state) =>
    customEventSelectors.selectAll(state)
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, id)
  );
  const index = React.useMemo(
    () => customEvents.findIndex((p) => p.id === id),
    [customEvents, id]
  );
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useAppDispatch();

  const scriptTabs = useMemo(
    () => ({
      script: l10n("SIDEBAR_CUSTOM_EVENT_SCRIPT"),
    }),
    []
  );

  const onChangeCustomEventProp = useCallback(
    <K extends keyof CustomEventNormalized>(
      key: K,
      value: CustomEventNormalized[K]
    ) => {
      dispatch(
        entitiesActions.editCustomEvent({
          customEventId: id,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, id]
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeCustomEventProp("name", e.currentTarget.value),
    [onChangeCustomEventProp]
  );

  const onChangeDescription = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeCustomEventProp("description", e.currentTarget.value),
    [onChangeCustomEventProp]
  );

  const onEditVariableName = useCallback(
    (key: string): React.ChangeEventHandler<HTMLInputElement> =>
      (e) => {
        if (!customEvent) {
          return;
        }
        const variable = customEvent.variables[key];
        if (!variable) {
          return;
        }

        onChangeCustomEventProp(
          "variables",
          Object.assign({}, customEvent.variables, {
            [key]: {
              ...variable,
              name: e.currentTarget.value,
            },
          })
        );
      },
    [customEvent, onChangeCustomEventProp]
  );

  const onEditVariablePassByReference = useCallback(
    (key: string, passByReference: boolean) => {
      if (!customEvent) {
        return;
      }
      const variable = customEvent.variables[key];
      if (!variable) {
        return;
      }

      onChangeCustomEventProp(
        "variables",
        Object.assign({}, customEvent.variables, {
          [key]: {
            ...variable,
            passByReference,
          },
        })
      );
    },
    [customEvent, onChangeCustomEventProp]
  );

  const onEditActorName = useCallback(
    (key: string): React.ChangeEventHandler<HTMLInputElement> =>
      (e) => {
        if (!customEvent) {
          return;
        }
        const actor = customEvent.actors[key];
        if (!actor) {
          return;
        }

        onChangeCustomEventProp(
          "actors",
          Object.assign({}, customEvent.actors, {
            [key]: {
              ...actor,
              name: e.currentTarget.value,
            },
          })
        );
      },
    [customEvent, onChangeCustomEventProp]
  );

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

  const scriptCtx: ScriptEditorCtx = useMemo(
    () => ({
      type: "script",
      entityType: "customEvent",
      entityId: id,
      sceneId: "",
      scriptKey: "script",
    }),
    [id]
  );

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

  const customEventVariables = Object.values(customEvent.variables);
  const customEventActors = Object.values(customEvent.actors);

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
                onChange={onChangeName}
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
                value={customEvent.description || ""}
                onChange={onChangeDescription}
              />
            </FormRow>
          </FormContainer>
          <div>
            {(customEventVariables.length > 0 ||
              customEventActors.length > 0) && (
              <FormHeader>
                <SidebarHeader>{l10n("SIDEBAR_PARAMETERS")}</SidebarHeader>
              </FormHeader>
            )}
            {customEventVariables.length > 0 && (
              <>
                <FormRow>
                  <Label htmlFor="variable[0]">
                    <strong>{l10n("FIELD_VARIABLES")}:</strong>{" "}
                    {`${customEventVariables.length}/10`}
                  </Label>
                </FormRow>

                {customEventVariables.map((variable, i) => {
                  if (!variable) {
                    return null;
                  }
                  return (
                    <FormRow key={variable.id}>
                      <InputGroup>
                        <Input
                          id={`variable[${i}]`}
                          value={variable.name}
                          placeholder="Variable Name"
                          onChange={onEditVariableName(variable.id)}
                        />
                        <InputGroupAppend>
                          <DropdownButton
                            label={
                              <span style={{ minWidth: 40, textAlign: "left" }}>
                                {variable.passByReference
                                  ? l10n("FIELD_PASS_BY_REFERENCE_SHORT")
                                  : l10n("FIELD_PASS_BY_VALUE_SHORT")}
                              </span>
                            }
                            title={
                              variable.passByReference
                                ? l10n("FIELD_PASS_BY_REFERENCE_DESCRIPTION")
                                : l10n("FIELD_PASS_BY_VALUE_DESCRIPTION")
                            }
                          >
                            <MenuItem
                              onClick={() =>
                                onEditVariablePassByReference(
                                  variable.id,
                                  false
                                )
                              }
                            >
                              <Checkbox
                                id="byVal"
                                name="byVal"
                                checked={!variable.passByReference}
                              />
                              {l10n("FIELD_PASS_BY_VALUE")}
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                onEditVariablePassByReference(variable.id, true)
                              }
                            >
                              <Checkbox
                                id="byRef"
                                name="byRef"
                                checked={variable.passByReference}
                              />
                              {l10n("FIELD_PASS_BY_REFERENCE")}
                            </MenuItem>
                          </DropdownButton>
                        </InputGroupAppend>
                      </InputGroup>
                    </FormRow>
                  );
                })}
              </>
            )}
            {customEventActors.length > 0 && (
              <>
                <FormRow>
                  <Label htmlFor="actor[0]">
                    <strong>{l10n("FIELD_ACTORS")}:</strong>{" "}
                    {`${customEventActors.length}/10`}
                  </Label>
                </FormRow>
                {customEventActors.map((actor, i) => {
                  if (!actor) {
                    return null;
                  }
                  return (
                    <FormRow key={actor.id}>
                      <Input
                        id={`actor[${i}]`}
                        value={actor.name}
                        placeholder="Actor Name"
                        onChange={onEditActorName(actor.id)}
                      />
                    </FormRow>
                  );
                })}
              </>
            )}
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
        <ScriptEditorContext.Provider value={scriptCtx}>
          <ScriptEditor value={customEvent.script} />
        </ScriptEditorContext.Provider>
      </SidebarColumn>
    </Sidebar>
  );
};

export default CustomEventEditor;
