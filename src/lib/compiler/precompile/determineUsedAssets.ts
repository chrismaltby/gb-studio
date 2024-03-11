import { Dictionary } from "@reduxjs/toolkit";
import type { Reference } from "components/forms/ReferencesSelect";
import { MAX_NESTED_SCRIPT_DEPTH } from "consts";
import { eventHasArg } from "lib/helpers/eventSystem";
import type {
  CustomEvent,
  Scene,
  SoundData,
  Variable,
} from "shared/lib/entities/entitiesTypes";
import { EVENT_SOUND_PLAY_EFFECT } from "consts";
import { walkScenesScripts } from "shared/lib/scripts/walk";

export const determineUsedAssets = ({
  scenes,
  variablesLookup,
  soundsLookup,
  customEventsLookup,
}: {
  scenes: Scene[];
  variablesLookup: Dictionary<Variable>;
  soundsLookup: Dictionary<SoundData>;
  customEventsLookup: Dictionary<CustomEvent>;
}) => {
  const usedVariablesLookup: Dictionary<Variable> = {};
  const usedSoundsLookup: Dictionary<SoundData> = {};

  const addAssetById =
    <T>(assetLookup: Dictionary<T>, usedLookup: Dictionary<T>) =>
    (id: string) => {
      const asset = assetLookup[id];
      if (asset && !usedLookup[id]) {
        usedLookup[id] = asset;
      }
    };

  const addVariableById = (id: string) => {
    if (!usedVariablesLookup[id]) {
      const variable = variablesLookup[id];
      if (variable) {
        usedVariablesLookup[id] = variable;
      } else {
        usedVariablesLookup[id] = {
          id,
          name: `VAR_${id}`,
          symbol: `VAR_${id}`,
        };
      }
    }
  };
  const addSoundById = addAssetById(soundsLookup, usedSoundsLookup);

  const addReferences = (
    references: Reference[],
    filterType: string,
    addFn: (id: string) => void
  ) => {
    const referencedIds = references
      .filter((ref) => ref.type === filterType)
      .map((ref) => ref.id);
    for (const id of referencedIds) {
      addFn(id);
    }
  };

  walkScenesScripts(
    scenes,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: MAX_NESTED_SCRIPT_DEPTH,
      },
    },
    (cmd) => {
      // Add Referenced Assets
      if (eventHasArg(cmd, "references") && cmd.args?.references) {
        const references = cmd.args?.references as Reference[];
        addReferences(references, "variable", addVariableById);
        addReferences(references, "sound", addSoundById);
      }

      // Sounds
      if (cmd.command === EVENT_SOUND_PLAY_EFFECT) {
        const type = (cmd.args?.type as string) ?? "";
        addSoundById(type);
      }
    }
  );

  return {
    usedVariablesLookup,
    usedSoundsLookup,
  };
};
