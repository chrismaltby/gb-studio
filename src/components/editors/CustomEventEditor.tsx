import React, { useCallback, useMemo, useState } from "react";
import ScriptEditor from "components/script/ScriptEditor";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
import { customEventSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { Sidebar, SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
  FormSectionTitle,
} from "ui/form/layout/FormLayout";
import { EditableText, EditableTextOverlay } from "ui/form/EditableText";
import { CustomEventNormalized } from "shared/lib/entities/entitiesTypes";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { BlankIcon, CheckIcon, LockIcon, LockOpenIcon } from "ui/icons/Icons";
import { CustomEventSymbolsEditor } from "components/forms/symbols/CustomEventSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { Checkbox } from "ui/form/Checkbox";
import { NoteField } from "ui/form/NoteField";
import { InputGroup, InputGroupAppend } from "ui/form/InputGroup";
import { Input } from "ui/form/Input";
import { Label } from "ui/form/Label";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import { FlexGrow } from "ui/spacing/Spacing";
import CachedScroll from "ui/util/CachedScroll";
import { ScriptUsesList } from "components/editors/script/ScriptUsesList";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";

const customEventName = (
  customEvent: CustomEventNormalized,
  customEventIndex: number
) => (customEvent.name ? customEvent.name : `Script ${customEventIndex + 1}`);

interface CustomEventEditorProps {
  id: string;
}

const FlexWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const UsesCollapsedWrapper = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 17px;
  border-top: 1px solid ${(props) => props.theme.colors.input.border};
`;

const CustomEventEditor = ({ id }: CustomEventEditorProps) => {
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
  const showUses = useAppSelector((state) => state.editor.showScriptUses);

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
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
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

  const setShowUses = useCallback(
    (value: boolean) => {
      dispatch(editorActions.setShowScriptUses(value));
    },
    [dispatch]
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
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={customEvent.id} cacheKey={customEvent.id}>
        <FlexWrapper>
          {(!lockScriptEditor || showUses) && (
            <FormContainer>
              <FormHeader>
                <FlexGrow style={{ minWidth: 0 }}>
                  <EditableText
                    name="name"
                    placeholder={customEventName(customEvent, index)}
                    value={customEvent.name || ""}
                    onChange={onChangeName}
                  />
                  <EditableTextOverlay>
                    {customEventName(customEvent, index).replace(/.*[/\\]/, "")}
                  </EditableTextOverlay>
                </FlexGrow>
                <DropdownButton
                  size="small"
                  variant="transparent"
                  menuDirection="right"
                >
                  {!showSymbols && !showUses && (
                    <MenuItem
                      onClick={() => setShowSymbols(true)}
                      icon={<BlankIcon />}
                    >
                      {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
                    </MenuItem>
                  )}
                  {!showUses && <MenuDivider key="div-view-mode" />}
                  <MenuItem
                    key="view-editor"
                    onClick={() => setShowUses(false)}
                    icon={!showUses ? <CheckIcon /> : <BlankIcon />}
                  >
                    {l10n("MENU_EDIT_CUSTOM_EVENT")}
                  </MenuItem>
                  <MenuItem
                    key="view-uses"
                    onClick={() => setShowUses(true)}
                    icon={showUses ? <CheckIcon /> : <BlankIcon />}
                  >
                    {l10n("FIELD_VIEW_SCRIPT_USES")}
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={onRemove} icon={<BlankIcon />}>
                    {l10n("MENU_DELETE_CUSTOM_EVENT")}
                  </MenuItem>
                </DropdownButton>
              </FormHeader>
            </FormContainer>
          )}
          {showUses ? (
            <ScriptUsesList id={id} onClose={() => setShowUses(false)} />
          ) : (
            <>
              {!lockScriptEditor && (
                <SidebarColumns>
                  <SidebarColumn>
                    <FormContainer>
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
                  </SidebarColumn>

                  {(customEventVariables.length > 0 ||
                    customEventActors.length > 0) && (
                    <>
                      {customEventVariables.length > 0 &&
                        customEventActors.length > 0 && (
                          <FormSectionTitle noMarginBottom>
                            {l10n("SIDEBAR_PARAMETERS")}
                          </FormSectionTitle>
                        )}

                      {customEventVariables.length > 0 && (
                        <SidebarColumn>
                          {customEventActors.length === 0 && (
                            <FormSectionTitle>
                              {l10n("SIDEBAR_PARAMETERS")}
                            </FormSectionTitle>
                          )}

                          <FormRow>
                            <Label htmlFor="variable[0]">
                              {l10n("FIELD_VARIABLES")}:{" "}
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
                                        <span
                                          style={{
                                            minWidth: 40,
                                            textAlign: "left",
                                          }}
                                        >
                                          {variable.passByReference
                                            ? l10n(
                                                "FIELD_PASS_BY_REFERENCE_SHORT"
                                              )
                                            : l10n("FIELD_PASS_BY_VALUE_SHORT")}
                                        </span>
                                      }
                                      title={
                                        variable.passByReference
                                          ? l10n(
                                              "FIELD_PASS_BY_REFERENCE_DESCRIPTION"
                                            )
                                          : l10n(
                                              "FIELD_PASS_BY_VALUE_DESCRIPTION"
                                            )
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
                                          onEditVariablePassByReference(
                                            variable.id,
                                            true
                                          )
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
                        </SidebarColumn>
                      )}
                      {customEventActors.length > 0 && (
                        <SidebarColumn>
                          {customEventVariables.length === 0 && (
                            <FormSectionTitle>
                              {l10n("SIDEBAR_PARAMETERS")}
                            </FormSectionTitle>
                          )}

                          <FormRow>
                            <Label htmlFor="actor[0]">
                              {l10n("FIELD_ACTORS")}:{" "}
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
                        </SidebarColumn>
                      )}
                    </>
                  )}
                </SidebarColumns>
              )}
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
            </>
          )}
          {!showUses && (
            <>
              <FlexGrow />
              <UsesCollapsedWrapper>
                <SplitPaneHeader
                  collapsed={true}
                  onToggle={() => setShowUses(true)}
                  borderBottom={false}
                >
                  {l10n("SIDEBAR_SCRIPT_USES")}
                </SplitPaneHeader>
              </UsesCollapsedWrapper>
            </>
          )}
        </FlexWrapper>
      </CachedScroll>
    </Sidebar>
  );
};

export default CustomEventEditor;
