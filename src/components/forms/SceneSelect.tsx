import React, { memo, useCallback, useMemo } from "react";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import {
  Option,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  Select,
  SelectCommonProps,
  FormatFolderLabel,
  findSelectOption,
} from "ui/form/Select";
import styled from "styled-components";
import editorActions from "store/features/editor/editorActions";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import { assetURLStyleProp } from "shared/lib/helpers/assets";
import {
  useAppDispatch,
  useAppSelectorPick,
  useAppSelectorPickArray,
} from "store/hooks";
import { SingleValue } from "react-select";

interface SceneSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  optional?: boolean;
  optionalLabel?: string;
  onChange?: (newId: string) => void;
}

const Thumbnail = styled.div`
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

type SceneSelectScene = {
  id: string;
  name: string;
  backgroundId: string;
};

type SceneSelectBackground = {
  id: string;
  filename: string;
  plugin?: string;
  _v?: number;
};

interface SceneOption extends Option {
  scene?: SceneSelectScene;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByLabel = (a: SceneOption, b: SceneOption) => {
  return collator.compare(a.label, b.label);
};

const sceneToSceneOption = (
  scene: SceneSelectScene,
  sceneIndex: number,
): SceneOption => ({
  value: scene.id,
  label: sceneName(scene, sceneIndex),
  scene,
});

export const SceneSelect = memo(
  ({
    value,
    onChange,
    optional,
    optionalLabel,
    ...selectProps
  }: SceneSelectProps) => {
    const dispatch = useAppDispatch();

    const scenes = useAppSelectorPickArray(sceneSelectors.selectAll, [
      "id",
      "name",
      "backgroundId",
    ] as const);

    const selectedScene = useAppSelectorPick(
      (state) => sceneSelectors.selectById(state, value || ""),
      ["id", "name", "backgroundId"] as const,
    );

    const backgrounds = useAppSelectorPickArray(backgroundSelectors.selectAll, [
      "id",
      "filename",
      "plugin",
      "_v",
    ] as const);

    const backgroundsLookup = useMemo<Record<string, SceneSelectBackground>>(
      () =>
        Object.fromEntries(
          backgrounds.map((background) => [background.id, background]),
        ),
      [backgrounds],
    );

    const selectedBackground = useAppSelectorPick(
      (state) =>
        selectedScene?.backgroundId
          ? backgroundSelectors.selectById(state, selectedScene.backgroundId)
          : undefined,
      ["filename", "plugin", "_v"] as const,
    );

    const options = useMemo(
      () =>
        ([] as SceneOption[]).concat(
          optional
            ? [
                {
                  value: "",
                  label: optionalLabel || "None",
                },
              ]
            : [],
          scenes.map(sceneToSceneOption).sort(sortByLabel),
        ),
      [scenes, optional, optionalLabel],
    );

    const currentValue = useMemo(() => {
      return findSelectOption(options, value);
    }, [options, value]);

    const onSelectChange = useCallback(
      (newValue: SingleValue<Option>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      },
      [onChange],
    );

    const onJumpToScene = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.altKey && value) {
          dispatch(editorActions.selectScene({ sceneId: value }));
          dispatch(editorActions.setFocusSceneId(value));
        }
      },
      [dispatch, value],
    );

    return (
      <div onClick={onJumpToScene}>
        <Select
          value={currentValue}
          options={options}
          onChange={onSelectChange}
          formatOptionLabel={(option: SceneOption) => {
            const background = option.scene
              ? backgroundsLookup[option.scene.backgroundId]
              : undefined;

            return (
              <OptionLabelWithPreview
                preview={
                  <Thumbnail
                    style={{
                      backgroundImage:
                        background &&
                        assetURLStyleProp("backgrounds", background),
                    }}
                  />
                }
              >
                <FormatFolderLabel label={option.label} />
              </OptionLabelWithPreview>
            );
          }}
          components={{
            SingleValue: () => (
              <SingleValueWithPreview
                preview={
                  <Thumbnail
                    style={{
                      backgroundImage:
                        selectedBackground &&
                        assetURLStyleProp("backgrounds", selectedBackground),
                    }}
                  />
                }
              >
                <FormatFolderLabel label={currentValue?.label} />
              </SingleValueWithPreview>
            ),
          }}
          {...selectProps}
        />
      </div>
    );
  },
);
