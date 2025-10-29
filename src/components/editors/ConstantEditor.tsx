import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  constantSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
} from "ui/form/layout/FormLayout";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { ConstantReference } from "components/forms/ReferencesSelect";
import ConstantUsesWorker, {
  ConstantUse,
  ConstantUseResult,
} from "./ConstantUses.worker";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CodeIcon } from "ui/icons/Icons";
import { defaultLocalisedConstantName } from "shared/lib/entities/entitiesHelpers";
import { NumberField } from "ui/form/NumberField";
import { ensureNumber } from "shared/types";
import {
  clampSigned16Bit,
  SIGNED_16BIT_MAX,
  SIGNED_16BIT_MIN,
} from "shared/lib/helpers/8bit";
import { WorldEditor } from "./WorldEditor";
import useWindowSize from "ui/hooks/use-window-size";

export const worker = new ConstantUsesWorker();

interface ConstantEditorProps {
  id: string;
}
interface UsesWrapperProps {
  $showSymbols: boolean;
}

const UsesWrapper = styled.div<UsesWrapperProps>`
  flex-grow: 1;
  border-top: 1px solid ${(props) => props.theme.colors.input.border};
`;

const UseMessage = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

const EditableConstantName = styled(EditableText)`
  text-transform: uppercase;
`;

export const ConstantEditor: FC<ConstantEditorProps> = ({ id }) => {
  const [fetching, setFetching] = useState(true);
  const { observe, entry } = useDimensions();
  const { height: winHeight } = useWindowSize();
  const constant = useAppSelector((state) =>
    constantSelectors.selectById(state, id),
  );
  const constantIndex = useAppSelector((state) =>
    constantSelectors.selectIds(state).indexOf(id),
  );
  const engineConstantsLookup = useAppSelector((state) => state.engine.consts);
  const isEngineConstant = id.startsWith("engine::");
  const engineConstantName = isEngineConstant
    ? id.replace(/^engine::/, "")
    : "";
  const engineConstantValue = isEngineConstant
    ? engineConstantsLookup?.[engineConstantName]
    : undefined;
  const [name, setName] = useState(constant?.name ?? engineConstantName);
  const [constantUses, setConstantUses] = useState<ConstantUse[]>([]);
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state),
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state),
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state),
  );
  const customEventsLookup = useAppSelector((state) =>
    customEventSelectors.selectEntities(state),
  );
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities,
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities,
  );
  const [showSymbols, setShowSymbols] = useState(false);

  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefs(state),
  );

  const dispatch = useAppDispatch();

  const onWorkerComplete = useCallback(
    (e: MessageEvent<ConstantUseResult>) => {
      if (e.data.id === id) {
        setFetching(false);
        setConstantUses(e.data.uses);
      }
    },
    [id],
  );

  const usesHeight = useMemo(() => {
    const top = entry?.target.getBoundingClientRect().top;
    if (top === undefined || winHeight === undefined) {
      return 0;
    }
    return winHeight - top - 32;
  }, [entry?.target, winHeight]);

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    if (constant) {
      setName(constant.name);
    }
  }, [constant]);

  useEffect(() => {
    setFetching(true);
    worker.postMessage({
      id,
      constantId: id,
      scenes,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      scriptEventsLookup,
      scriptEventDefs,
      customEventsLookup,
      l10NData: getL10NData(),
    });
  }, [
    scenes,
    actorsLookup,
    triggersLookup,
    id,
    scriptEventsLookup,
    scriptEventDefs,
    customEventsLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
  ]);

  const onRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    const editValue = e.currentTarget.value;
    setName(editValue);
  };

  const onRenameFinished = () => {
    const validName = name.toLocaleUpperCase().replace(/\s/g, "_");
    setName(validName);
    dispatch(
      entitiesActions.renameConstant({
        constantId: id,
        name: validName,
      }),
    );
  };

  const onChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = clampSigned16Bit(
      ensureNumber(Number(e.currentTarget.value), 0),
    );
    dispatch(
      entitiesActions.editConstant({
        constantId: id,
        changes: {
          value: newValue,
        },
      }),
    );
  };

  const setSelectedId = (id: string, item: ConstantUse) => {
    if (item.type === "scene") {
      dispatch(editorActions.selectScene({ sceneId: id }));
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "custom") {
      dispatch(editorActions.selectCustomEvent({ customEventId: id }));
    }
  };

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onRemove = useCallback(() => {
    if (!constant) {
      return;
    }
    dispatch(entitiesActions.removeConstant({ constantId: constant.id }));
  }, [dispatch, constant]);

  if (!constant && !isEngineConstant) {
    return <WorldEditor />;
  }

  const displayName = isEngineConstant ? engineConstantName : name;
  const displayValue = isEngineConstant
    ? typeof engineConstantValue === "string"
      ? parseInt(engineConstantValue, 10)
      : (engineConstantValue ?? 0)
    : (constant?.value ?? 0);

  return (
    <Sidebar onClick={selectSidebar}>
      <FormHeader>
        <EditableConstantName
          name="name"
          placeholder={
            isEngineConstant
              ? engineConstantName
              : defaultLocalisedConstantName(constantIndex)
                  .toLocaleUpperCase()
                  .replace(/\s/g, "_")
          }
          value={displayName || ""}
          onChange={isEngineConstant ? undefined : onRename}
          onBlur={isEngineConstant ? undefined : onRenameFinished}
          readOnly={isEngineConstant}
        />
        {!isEngineConstant && (
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
            <MenuDivider />
            <MenuItem onClick={onRemove}>
              {l10n("MENU_DELETE_CONSTANT")}
            </MenuItem>
          </DropdownButton>
        )}
      </FormHeader>

      <SidebarColumn>
        <FormContainer>
          {showSymbols && !isEngineConstant && (
            <>
              <SymbolEditorWrapper>
                <ConstantReference id={id} />
              </SymbolEditorWrapper>
              <FormDivider />
            </>
          )}
          <FormRow>
            <NumberField
              name="constantValue"
              label={l10n("FIELD_VALUE")}
              placeholder="0"
              value={displayValue}
              onChange={isEngineConstant ? undefined : onChangeValue}
              max={SIGNED_16BIT_MAX}
              min={SIGNED_16BIT_MIN}
              readOnly={isEngineConstant}
            />
          </FormRow>
        </FormContainer>

        <UsesWrapper ref={observe} $showSymbols={showSymbols}>
          <SplitPaneHeader collapsed={false}>
            {l10n("SIDEBAR_CONSTANT_USES")}
          </SplitPaneHeader>
          {fetching ? (
            <UseMessage>...</UseMessage>
          ) : (
            <>
              {constantUses.length > 0 ? (
                <FlatList
                  items={constantUses}
                  height={usesHeight}
                  setSelectedId={setSelectedId}
                  children={({ item }) => {
                    switch (item.type) {
                      case "scene":
                        return <EntityListItem item={item} type={item.type} />;
                      case "custom":
                        return (
                          <EntityListItem
                            item={item}
                            type={item.type}
                            icon={<CodeIcon />}
                          />
                        );
                      default:
                        return (
                          <EntityListItem
                            item={item}
                            type={item.type}
                            nestLevel={1}
                          />
                        );
                    }
                  }}
                />
              ) : (
                <UseMessage>{l10n("FIELD_CONSTANT_NOT_USED")}</UseMessage>
              )}
            </>
          )}
        </UsesWrapper>
      </SidebarColumn>
    </Sidebar>
  );
};
