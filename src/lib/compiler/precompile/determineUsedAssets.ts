import { Dictionary } from "@reduxjs/toolkit";
import type { Reference } from "components/forms/ReferencesSelect";
import { MAX_NESTED_SCRIPT_DEPTH } from "consts";
import { eventHasArg } from "lib/helpers/eventSystem";
import type {
  CustomEvent,
  FontData,
  // Scene,
  SoundData,
  Variable,
} from "shared/lib/entities/entitiesTypes";
import { EVENT_SOUND_PLAY_EFFECT } from "consts";
import { walkScenesScripts } from "shared/lib/scripts/walk";
import { ScriptEventHandlers } from "lib/project/loadScriptEventHandlers";
import type { ProjectData } from "store/features/project/projectActions";
import keyBy from "lodash/keyBy";

export const determineUsedAssets = ({
  projectData,
  customEventsLookup,
  scriptEventHandlers,
}: {
  projectData: ProjectData;
  customEventsLookup: Dictionary<CustomEvent>;
  scriptEventHandlers: ScriptEventHandlers;
}) => {
  const variablesLookup = keyBy(projectData.variables, "id");
  const soundsLookup = keyBy(projectData.sounds, "id");
  const fontsLookup = keyBy(projectData.fonts, "id");

  const usedVariablesLookup: Dictionary<Variable> = {};
  const usedSoundsLookup: Dictionary<SoundData> = {};
  const usedFontsLookup: Dictionary<FontData> = {};

  const addAssetById =
    <T>(assetLookup: Dictionary<T>, usedLookup: Dictionary<T>) =>
    (id: string) => {
      const asset = assetLookup[id];
      if (asset && !usedLookup[id]) {
        usedLookup[id] = asset;
      }
      return !!asset;
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

  const addFontById = addAssetById(fontsLookup, usedFontsLookup);

  const addFontsFromString = (s: string) => {
    (s.match(/(!F:[0-9a-f-]+!)/g) || [])
      .map((id) => id.substring(3).replace(/!$/, ""))
      .forEach(addFontById);
  };

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

  // Add default font
  if (!addFontById(projectData.settings.defaultFontId)) {
    if (projectData.fonts.length > 0) {
      addFontById(projectData.fonts[0].id);
    }
  }

  walkScenesScripts(
    projectData.scenes,
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
        addReferences(references, "font", addFontById);
      }

      // Sounds
      if (cmd.command === EVENT_SOUND_PLAY_EFFECT) {
        const type = (cmd.args?.type as string) ?? "";
        addSoundById(type);
      }

      if (cmd.args) {
        for (const key in cmd.args) {
          const value = cmd.args[key];
          const fieldType =
            scriptEventHandlers[cmd.command]?.fieldsLookup[key]?.type;

          if (fieldType === "textarea" && typeof value === "string") {
            // String text fields
            addFontsFromString(value);
          } else if (fieldType === "textarea" && Array.isArray(value)) {
            // Multi value text fields
            for (const row of value) {
              if (typeof row === "string") {
                addFontsFromString(row);
              }
            }
          }
        }
      }
    }
  );

  return {
    referencedVariables: Object.values(usedVariablesLookup) as Variable[],
    referencedSounds: Object.values(usedSoundsLookup) as SoundData[],
    referencedFonts: Object.values(usedFontsLookup) as FontData[],
  };
};
