import React, { FC, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { assetFilename } from "lib/helpers/gbstudio";
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
} from "ui/form/Select";
import { Scene } from "store/features/entities/entitiesTypes";
import { RootState } from "store/configureStore";
import styled from "styled-components";
import editorActions from "store/features/editor/editorActions";

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
  scene: Scene;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByLabel = (a: SceneOption, b: SceneOption) => {
  return collator.compare(a.label, b.label);
};

const sceneToSceneOption = (scene: Scene, sceneIndex: number): SceneOption => ({
  value: scene.id,
  label: scene.name ? scene.name : `Scene ${sceneIndex + 1}`,
  scene,
});

export const SceneSelect: FC<SceneSelectProps> = ({
  value,
  onChange,
  optional,
  optionalLabel,
  ...selectProps
}) => {
  const scenes = useSelector((state: RootState) =>
    sceneSelectors.selectAll(state)
  );
  const backgroundsLookup = useSelector((state: RootState) =>
    backgroundSelectors.selectEntities(state)
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, value || "")
  );
  const background = useSelector((state: RootState) =>
    backgroundSelectors.selectById(state, scene?.backgroundId || "")
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const [options, setOptions] = useState<SceneOption[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene>();
  const [currentValue, setCurrentValue] = useState<Option>();
  const dispatch = useDispatch();

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
        scenes.map(sceneToSceneOption).sort(sortByLabel)
      )
    );
  }, [scenes, optional, optionalLabel]);

  useEffect(() => {
    setCurrentScene(scenes.find((v) => v.id === value));
  }, [scenes, value]);

  useEffect(() => {
    if (currentScene) {
      setCurrentValue(
        sceneToSceneOption(currentScene, scenes.indexOf(currentScene))
      );
    }
  }, [currentScene, scenes]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
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
          return (
            <OptionLabelWithPreview
              preview={
                <Thumbnail
                  style={{
                    backgroundImage:
                      backgroundsLookup[option.scene?.backgroundId] &&
                      `url("file://${assetFilename(
                        projectRoot,
                        "backgrounds",
                        backgroundsLookup[option.scene?.backgroundId]
                      )}?_v=${
                        backgroundsLookup[option.scene?.backgroundId]?._v
                      }")`,
                  }}
                />
              }
            >
              {option.label}
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
                      `url("file://${assetFilename(
                        projectRoot,
                        "backgrounds",
                        background
                      )}?_v=${background._v}")`,
                  }}
                />
              }
            >
              {currentValue?.label}
            </SingleValueWithPreview>
          ),
        }}
        {...selectProps}
      />
    </div>
  );
};
