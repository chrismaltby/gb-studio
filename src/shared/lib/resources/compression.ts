import {
  BackgroundResource,
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResourceWithChildren,
  ProjectResources,
  SceneResource,
} from "shared/lib/resources/types";

export const compress8bitNumberArray = (arr: number[] | undefined): string => {
  if (!arr) {
    return "";
  }
  let lastValue = -1;
  let output = "";
  let count = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== lastValue) {
      if (count === 1) {
        output += "!";
      } else if (count > 0) {
        output += `${count.toString(16)}+`;
      }
      count = 0;
      lastValue = arr[i];
      output += (lastValue % 256).toString(16).padStart(2, "0");
    }
    count++;
  }
  if (count === 1) {
    output += "!";
  } else if (count > 0) {
    output += `${count.toString(16)}+`;
  }

  return output;
};

export const decompress8bitNumberString = (str: string): number[] => {
  const arr: number[] = [];
  let i = 0;
  while (i < str.length) {
    // Read the value
    const value = parseInt(str.slice(i, i + 2), 16);
    i += 2;
    let count = 1;
    if (i < str.length) {
      if (str[i] === "!") {
        // Single occurrence
        count = 1;
        i++;
      } else {
        // Read the count
        const countStart = i;
        const countEnd = str.indexOf("+", countStart);
        count = parseInt(str.slice(countStart, countEnd), 16);
        i = countEnd + 1;
      }
    }
    // Add the value `count` times to the array
    for (let j = 0; j < count; j++) {
      arr.push(value);
    }
  }
  return arr;
};

const decompressSceneResource = (
  scene: CompressedSceneResourceWithChildren
): SceneResource => {
  return {
    ...scene,
    collisions: decompress8bitNumberString(scene.collisions),
  };
};

const decompressBackgroundResource = (
  background: CompressedBackgroundResource
): BackgroundResource => {
  return {
    ...background,
    tileColors: decompress8bitNumberString(background.tileColors),
  };
};

export const decompressProjectResources = (
  compressedResources: CompressedProjectResources
): ProjectResources => {
  return {
    ...compressedResources,
    scenes: compressedResources.scenes.map(decompressSceneResource),
    backgrounds: compressedResources.backgrounds.map(
      decompressBackgroundResource
    ),
  };
};

export const compressSceneResource = (
  scene: SceneResource
): CompressedSceneResourceWithChildren => {
  return {
    ...scene,
    collisions: compress8bitNumberArray(scene.collisions),
  };
};

export const compressBackgroundResource = (
  background: BackgroundResource
): CompressedBackgroundResource => {
  return {
    ...background,
    tileColors: compress8bitNumberArray(background.tileColors),
  };
};

export const compressProjectResources = (
  resources: ProjectResources
): CompressedProjectResources => {
  return {
    ...resources,
    scenes: resources.scenes.map(compressSceneResource),
    backgrounds: resources.backgrounds.map(compressBackgroundResource),
  };
};
