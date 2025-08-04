import React, { FC, useState, useEffect } from "react";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import {
  Option,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  Select,
  SelectCommonProps,
  FormatFolderLabel,
} from "ui/form/Select";
import { SceneNormalized } from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import editorActions from "store/features/editor/editorActions";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import { assetURLStyleProp } from "shared/lib/helpers/assets";
import { useAppDispatch, useAppSelector } from "store/hooks";
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

interface SceneOption extends Option {
  scene: SceneNormalized;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByLabel = (a: SceneOption, b: SceneOption) => {
  return collator.compare(a.label, b.label);
};

const sceneToSceneOption = (
  scene: SceneNormalized,
  sceneIndex: number,
): SceneOption => ({
  value: scene.id,
  label: sceneName(scene, sceneIndex),
  scene,
});

export const SceneSelect: FC<SceneSelectProps> = ({
  value,
  onChange,
  optional,
  optionalLabel,
  ...selectProps
}) => {
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const backgroundsLookup = useAppSelector((state) =>
    backgroundSelectors.selectEntities(state),
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, value || ""),
  );
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, scene?.backgroundId || ""),
  );
  const [options, setOptions] = useState<SceneOption[]>([]);
  const [currentScene, setCurrentScene] = useState<SceneNormalized>();
  const [currentValue, setCurrentValue] = useState<SceneOption>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    setOptions(scenes.map(sceneToSceneOption).sort(sortByLabel));
  }, [scenes]);

  useEffect(() => {
    setOptions(
      ([] as SceneOption[]).concat(
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
              },
            ] as SceneOption[])
          : ([] as SceneOption[]),
        scenes.map(sceneToSceneOption).sort(sortByLabel),
      ),
    );
  }, [scenes, optional, optionalLabel]);

  useEffect(() => {
    setCurrentScene(scenes.find((v) => v.id === value));
  }, [scenes, value]);

  useEffect(() => {
    if (currentScene) {
      setCurrentValue(
        sceneToSceneOption(currentScene, scenes.indexOf(currentScene)),
      );
    }
  }, [currentScene, scenes]);

  const onSelectChange = (newValue: SingleValue<Option>) => {
    if (newValue) {
      onChange?.(newValue.value);
    }
  };

  const onJumpToScene = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.altKey) {
      if (value) {
        dispatch(editorActions.selectScene({ sceneId: value }));
        dispatch(editorActions.setFocusSceneId(value));
      }
    }
  };

  return (
    <div onClick={onJumpToScene}>
      <Select
        value={currentValue}
        options={options}
        onChange={onSelectChange}
        formatOptionLabel={(option: SceneOption) => {
          const background = backgroundsLookup[option.scene?.backgroundId];
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
                      background &&
                      assetURLStyleProp("backgrounds", background),
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
};
