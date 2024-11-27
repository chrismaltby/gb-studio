import { Value } from "@sinclair/typebox/value";
import {
  ActorDirection,
  SceneParallaxLayer,
  CollisionGroup,
  MinimalResource,
  ActorResource,
  TriggerResource,
  CompressedSceneResource,
  ScriptVariable,
  ScriptActor,
  ScriptResource,
  CompressedBackgroundResource,
  TilesetResource,
  SpriteAnimationType,
  SpriteAnimation,
  SpriteState,
  SpriteResource,
  EmoteResource,
  AvatarResource,
  FontResource,
  SoundType,
  SoundResource,
  MusicResource,
  PaletteResource,
  SettingsResource,
  VariableData,
  VariablesResource,
  EngineFieldValueData,
  EngineFieldValuesResource,
  isProjectMetadataResource,
} from "shared/lib/resources/types";

describe("TypeBox Schemas", () => {
  it("should validate ActorDirection", () => {
    const validDirections = ["up", "down", "left", "right"];
    const invalidDirections = ["north", "south", "east", "west", "", null];

    validDirections.forEach((direction) => {
      expect(() => Value.Decode(ActorDirection, direction)).not.toThrow();
    });

    invalidDirections.forEach((direction) => {
      expect(() => Value.Decode(ActorDirection, direction)).toThrow();
    });
  });

  it("should validate SceneParallaxLayer", () => {
    const validLayer = { height: 10, speed: 1.5 };
    const invalidLayer = { height: "10", speed: "fast" };

    expect(() => Value.Decode(SceneParallaxLayer, validLayer)).not.toThrow();
    expect(() => Value.Decode(SceneParallaxLayer, invalidLayer)).toThrow();
  });

  it("should validate CollisionGroup", () => {
    const validGroups = ["", "1", "2", "3", "player"];
    const invalidGroups = ["group1", "2.5", null];

    validGroups.forEach((group) => {
      expect(() => Value.Decode(CollisionGroup, group)).not.toThrow();
    });

    invalidGroups.forEach((group) => {
      expect(() => Value.Decode(CollisionGroup, group)).toThrow();
    });
  });

  it("should validate MinimalResource", () => {
    const validResource = { _resourceType: "someType" };
    const invalidResource = { type: "someType" };

    expect(() => Value.Decode(MinimalResource, validResource)).not.toThrow();
    expect(() => Value.Decode(MinimalResource, invalidResource)).toThrow();
  });

  it("should validate ActorResource", () => {
    const validActor: ActorResource = {
      _resourceType: "actor",
      _index: 0,
      id: "actor1",
      symbol: "symbol",
      name: "Actor 1",
      x: 10,
      y: 20,
      frame: 0,
      animate: true,
      spriteSheetId: "sprite1",
      paletteId: "palette1",
      direction: "down",
      moveSpeed: 1,
      animSpeed: 15,
      isPinned: false,
      persistent: true,
      collisionGroup: "",
      collisionExtraFlags: [],
      prefabId: "",
      prefabScriptOverrides: {},
      script: [],
      startScript: [],
      updateScript: [],
      hit1Script: [],
      hit2Script: [],
      hit3Script: [],
    };
    const invalidActor = {
      _resourceType: "actor",
      _index: 0,
      id: "actor1",
      symbol: "symbol",
      name: "Actor 1",
      x: 10,
      y: 20,
      frame: 0,
      animate: true,
      spriteSheetId: "sprite1",
      paletteId: "palette1",
      direction: "upwards",
      moveSpeed: 1,
      animSpeed: 15,
      isPinned: false,
      persistent: true,
      collisionGroup: "",
      script: [],
      startScript: [],
      updateScript: [],
      hit1Script: [],
      hit2Script: [],
      hit3Script: [],
    };

    expect(() => Value.Decode(ActorResource, validActor)).not.toThrow();
    expect(() => Value.Decode(ActorResource, invalidActor)).toThrow();
  });

  it("should validate TriggerResource", () => {
    const validTrigger: TriggerResource = {
      _resourceType: "trigger",
      _index: 0,
      id: "trigger1",
      symbol: "symbol",
      name: "Trigger 1",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      prefabId: "",
      prefabScriptOverrides: {},
      script: [],
      leaveScript: [],
    };
    const invalidTrigger = {
      _resourceType: "trigger",
      _index: 0,
      id: "trigger1",
      symbol: "symbol",
      name: "Trigger 1",
      x: 10,
      y: 20,
      script: [],
      leaveScript: [],
    };

    expect(() => Value.Decode(TriggerResource, validTrigger)).not.toThrow();
    expect(() => Value.Decode(TriggerResource, invalidTrigger)).toThrow();
  });

  it("should validate CompressedSceneResource", () => {
    const validScene: CompressedSceneResource = {
      _resourceType: "scene",
      _index: 0,
      id: "scene1",
      type: "someType",
      name: "Scene 1",
      symbol: "symbol",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      backgroundId: "background1",
      tilesetId: "tileset1",
      colorModeOverride: "none",
      paletteIds: ["palette1", "palette2"],
      spritePaletteIds: ["spritePalette1"],
      autoFadeSpeed: 1,
      script: [],
      playerHit1Script: [],
      playerHit2Script: [],
      playerHit3Script: [],
      collisions: "collisions",
    };
    const invalidScene = {
      _resourceType: "scene",
      id: "scene1",
      type: "someType",
      name: "Scene 1",
      symbol: "symbol",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      backgroundId: "background1",
      tilesetId: "tileset1",
      paletteIds: "palette1",
      spritePaletteIds: ["spritePalette1"],
      autoFadeSpeed: 1,
      script: [],
      playerHit1Script: [],
      playerHit2Script: [],
      playerHit3Script: [],
      collisions: "collisions",
    };

    expect(() =>
      Value.Decode(CompressedSceneResource, validScene),
    ).not.toThrow();
    expect(() => Value.Decode(CompressedSceneResource, invalidScene)).toThrow();
  });

  it("should validate ScriptVariable", () => {
    const validVariable = {
      id: "var1",
      name: "Variable 1",
      passByReference: false,
    };
    const invalidVariable = { id: "var1", name: "Variable 1" };

    expect(() => Value.Decode(ScriptVariable, validVariable)).not.toThrow();
    expect(() => Value.Decode(ScriptVariable, invalidVariable)).toThrow();
  });

  it("should validate ScriptActor", () => {
    const validActor = { id: "actor1", name: "Actor 1" };
    const invalidActor = { id: "actor1" };

    expect(() => Value.Decode(ScriptActor, validActor)).not.toThrow();
    expect(() => Value.Decode(ScriptActor, invalidActor)).toThrow();
  });

  it("should validate ScriptResource", () => {
    const validScript = {
      _resourceType: "script",
      id: "script1",
      name: "Script 1",
      symbol: "symbol",
      description: "Description",
      variables: {
        var1: { id: "var1", name: "Variable 1", passByReference: false },
      },
      actors: { actor1: { id: "actor1", name: "Actor 1" } },
      script: [],
    };
    const invalidScript = {
      _resourceType: "script",
      id: "script1",
      name: "Script 1",
      symbol: "symbol",
      description: "Description",
      variables: "variables",
      actors: { actor1: { id: "actor1", name: "Actor 1" } },
      script: [],
    };

    expect(() => Value.Decode(ScriptResource, validScript)).not.toThrow();
    expect(() => Value.Decode(ScriptResource, invalidScript)).toThrow();
  });

  it("should validate CompressedBackgroundResource", () => {
    const validBackground = {
      _resourceType: "background",
      id: "background1",
      name: "Background 1",
      symbol: "symbol",
      filename: "filename",
      width: 100,
      height: 100,
      imageWidth: 100,
      imageHeight: 100,
      tileColors: "colors",
    };
    const invalidBackground = {
      _resourceType: "background",
      id: "background1",
      name: "Background 1",
      symbol: "symbol",
      filename: "filename",
      width: 100,
      height: 100,
      imageWidth: 100,
      imageHeight: 100,
    };

    expect(() =>
      Value.Decode(CompressedBackgroundResource, validBackground),
    ).not.toThrow();
    expect(() =>
      Value.Decode(CompressedBackgroundResource, invalidBackground),
    ).toThrow();
  });

  it("should validate TilesetResource", () => {
    const validTileset = {
      _resourceType: "tileset",
      id: "tileset1",
      name: "Tileset 1",
      symbol: "symbol",
      filename: "filename",
      width: 100,
      height: 100,
      imageWidth: 100,
      imageHeight: 100,
    };
    const invalidTileset = {
      _resourceType: "tileset",
      id: "tileset1",
      name: "Tileset 1",
      symbol: "symbol",
      filename: "filename",
      width: 100,
      height: 100,
    };

    expect(() => Value.Decode(TilesetResource, validTileset)).not.toThrow();
    expect(() => Value.Decode(TilesetResource, invalidTileset)).toThrow();
  });

  it("should validate SpriteAnimationType", () => {
    const validTypes = [
      "fixed",
      "fixed_movement",
      "multi",
      "multi_movement",
      "platform_player",
      "cursor",
    ];
    const invalidTypes = ["static", "dynamic", ""];

    validTypes.forEach((type) => {
      expect(() => Value.Decode(SpriteAnimationType, type)).not.toThrow();
    });

    invalidTypes.forEach((type) => {
      expect(() => Value.Decode(SpriteAnimationType, type)).toThrow();
    });
  });

  it("should validate SpriteAnimation", () => {
    const validAnimation = { id: "anim1", frames: [] };
    const invalidAnimation = { id: "anim1", frames: "frames" };

    expect(() => Value.Decode(SpriteAnimation, validAnimation)).not.toThrow();
    expect(() => Value.Decode(SpriteAnimation, invalidAnimation)).toThrow();
  });

  it("should validate SpriteState", () => {
    const validState = {
      id: "state1",
      name: "State 1",
      animationType: "fixed",
      flipLeft: false,
      animations: [],
    };
    const invalidState = {
      id: "state1",
      name: "State 1",
      animationType: "fixed",
      flipLeft: false,
      animations: "animations",
    };

    expect(() => Value.Decode(SpriteState, validState)).not.toThrow();
    expect(() => Value.Decode(SpriteState, invalidState)).toThrow();
  });

  it("should validate SpriteResource", () => {
    const validSprite = {
      _resourceType: "sprite",
      id: "sprite1",
      name: "Sprite 1",
      symbol: "symbol",
      filename: "filename",
      numTiles: 1,
      checksum: "checksum",
      width: 16,
      height: 16,
      canvasWidth: 16,
      canvasHeight: 16,
      boundsX: 0,
      boundsY: 0,
      boundsWidth: 16,
      boundsHeight: 16,
      animSpeed: null,
      states: [],
    };
    const invalidSprite = {
      _resourceType: "sprite",
      id: "sprite1",
      name: "Sprite 1",
      symbol: "symbol",
      filename: "filename",
      numTiles: 1,
      checksum: "checksum",
      width: 16,
      height: 16,
      canvasWidth: 16,
      canvasHeight: 16,
      boundsX: 0,
      boundsY: 0,
      boundsWidth: 16,
      boundsHeight: 16,
      animSpeed: null,
    };

    expect(() => Value.Decode(SpriteResource, validSprite)).not.toThrow();
    expect(() => Value.Decode(SpriteResource, invalidSprite)).toThrow();
  });

  it("should validate EmoteResource", () => {
    const validEmote = {
      _resourceType: "emote",
      id: "emote1",
      name: "Emote 1",
      symbol: "symbol",
      filename: "filename",
      width: 16,
      height: 16,
    };
    const invalidEmote = {
      _resourceType: "emote",
      id: "emote1",
      name: "Emote 1",
      symbol: "symbol",
      filename: "filename",
      width: 16,
      height: "16",
    };

    expect(() => Value.Decode(EmoteResource, validEmote)).not.toThrow();
    expect(() => Value.Decode(EmoteResource, invalidEmote)).toThrow();
  });

  it("should validate AvatarResource", () => {
    const validAvatar = {
      _resourceType: "avatar",
      id: "avatar1",
      name: "Avatar 1",
      filename: "filename",
      width: 16,
      height: 16,
    };
    const invalidAvatar = {
      _resourceType: "avatar",
      id: "avatar1",
      name: "Avatar 1",
      filename: "filename",
      width: 16,
    };

    expect(() => Value.Decode(AvatarResource, validAvatar)).not.toThrow();
    expect(() => Value.Decode(AvatarResource, invalidAvatar)).toThrow();
  });

  it("should validate FontResource", () => {
    const validFont: FontResource = {
      _resourceType: "font",
      id: "font1",
      name: "Font 1",
      symbol: "symbol",
      filename: "filename",
      width: 16,
      height: 16,
      mapping: {},
    };
    const invalidFont = {
      _resourceType: "font",
      id: "font1",
      name: "Font 1",
      symbol: "symbol",
      filename: "filename",
      width: 16,
    };

    expect(() => Value.Decode(FontResource, validFont)).not.toThrow();
    expect(() => Value.Decode(FontResource, invalidFont)).toThrow();
  });

  it("should validate SoundType", () => {
    const validTypes = ["wav", "vgm", "fxhammer"];
    const invalidTypes = ["mp3", "ogg", ""];

    validTypes.forEach((type) => {
      expect(() => Value.Decode(SoundType, type)).not.toThrow();
    });

    invalidTypes.forEach((type) => {
      expect(() => Value.Decode(SoundType, type)).toThrow();
    });
  });

  it("should validate SoundResource", () => {
    const validSound = {
      _resourceType: "sound",
      id: "sound1",
      name: "Sound 1",
      symbol: "symbol",
      filename: "filename",
      type: "wav",
    };
    const invalidSound = {
      _resourceType: "sound",
      id: "sound1",
      name: "Sound 1",
      symbol: "symbol",
      filename: "filename",
    };

    expect(() => Value.Decode(SoundResource, validSound)).not.toThrow();
    expect(() => Value.Decode(SoundResource, invalidSound)).toThrow();
  });

  it("should validate MusicResource", () => {
    const validMusic = {
      _resourceType: "music",
      id: "music1",
      name: "Music 1",
      symbol: "symbol",
      filename: "filename",
      settings: {},
    };
    const invalidMusic = {
      _resourceType: "music",
      id: "music1",
      name: "Music 1",
      symbol: "symbol",
      filename: "filename",
    };

    expect(() => Value.Decode(MusicResource, validMusic)).not.toThrow();
    expect(() => Value.Decode(MusicResource, invalidMusic)).toThrow();
  });

  it("should validate PaletteResource", () => {
    const validPalette = {
      _resourceType: "palette",
      id: "palette1",
      name: "Palette 1",
      colors: ["#FFFFFF", "#AAAAAA", "#555555", "#000000"],
    };
    const invalidPalette = {
      _resourceType: "palette",
      id: "palette1",
      name: "Palette 1",
      colors: ["#FFFFFF", "#AAAAAA", "#555555"],
    };

    expect(() => Value.Decode(PaletteResource, validPalette)).not.toThrow();
    expect(() => Value.Decode(PaletteResource, invalidPalette)).toThrow();
  });

  it("should validate SettingsResource", () => {
    const validSettings: SettingsResource = {
      _resourceType: "settings",
      startSceneId: "scene1",
      startX: 10,
      startY: 20,
      startMoveSpeed: 1,
      startAnimSpeed: null,
      startDirection: "down",
      showCollisions: true,
      showConnections: "all",
      showCollisionSlopeTiles: true,
      showCollisionExtraTiles: true,
      showCollisionTileValues: false,
      collisionLayerOpacity: 50,
      worldScrollX: 0,
      worldScrollY: 0,
      zoom: 1,
      sgbEnabled: false,
      customHead: "head",
      defaultBackgroundPaletteIds: [
        "palette1",
        "palette2",
        "palette3",
        "palette4",
        "palette5",
        "palette6",
        "palette7",
        "palette8",
      ],
      defaultSpritePaletteIds: [
        "spritePalette1",
        "spritePalette2",
        "spritePalette3",
        "spritePalette4",
        "spritePalette5",
        "spritePalette6",
        "spritePalette7",
        "spritePalette8",
      ],
      defaultSpritePaletteId: "spritePalette1",
      defaultUIPaletteId: "uiPalette",
      playerPaletteId: "playerPalette",
      navigatorSplitSizes: [200, 300],
      showNavigator: true,
      defaultFontId: "font1",
      defaultCharacterEncoding: "utf-8",
      defaultPlayerSprites: { player1: "sprite1" },
      musicDriver: "huge",
      cartType: "mbc5",
      batterylessEnabled: false,
      favoriteEvents: [],
      customColorsWhite: "#FFFFFF",
      customColorsLight: "#AAAAAA",
      customColorsDark: "#555555",
      customColorsBlack: "#000000",
      customControlsUp: [],
      customControlsDown: [],
      customControlsLeft: [],
      customControlsRight: [],
      customControlsA: [],
      customControlsB: [],
      customControlsStart: [],
      customControlsSelect: [],
      debuggerEnabled: false,
      debuggerScriptType: "editor",
      debuggerVariablesFilter: "all",
      debuggerCollapsedPanes: [],
      debuggerPauseOnScriptChanged: false,
      debuggerPauseOnWatchedVariableChanged: false,
      debuggerBreakpoints: [],
      debuggerWatchedVariables: [],
      colorMode: "mono",
      colorCorrection: "default",
      previewAsMono: false,
      openBuildLogOnWarnings: true,
      generateDebugFilesEnabled: false,
      compilerPreset: 3000,
      scriptEventPresets: {},
      scriptEventDefaultPresets: {},
      runSceneSelectionOnly: false,
      spriteMode: "8x16",
    };
    const invalidSettings = {
      _resourceType: "settings",
      startSceneId: "scene1",
      startX: 10,
      startY: 20,
      startMoveSpeed: 1,
      startAnimSpeed: null,
      startDirection: "down",
      showCollisions: true,
      collisionLayerOpacity: 50,
      showConnections: "all",
      showCollisionSlopeTiles: true,
      showCollisionExtraTiles: true,
      showCollisionTileValues: false,
      worldScrollX: 0,
      worldScrollY: 0,
      zoom: 1,
      sgbEnabled: false,
      customHead: "head",
      defaultBackgroundPaletteIds: [
        "palette1",
        "palette2",
        "palette3",
        "palette4",
        "palette5",
        "palette6",
        "palette7",
      ],
      defaultSpritePaletteIds: [
        "spritePalette1",
        "spritePalette2",
        "spritePalette3",
        "spritePalette4",
        "spritePalette5",
        "spritePalette6",
        "spritePalette7",
        "spritePalette8",
      ],
      defaultSpritePaletteId: "spritePalette1",
      defaultUIPaletteId: "uiPalette",
      playerPaletteId: "playerPalette",
      navigatorSplitSizes: [200, 300],
      showNavigator: true,
      defaultFontId: "font1",
      defaultCharacterEncoding: "utf-8",
      defaultPlayerSprites: { player1: "sprite1" },
      musicDriver: "huge",
      cartType: "mbc5",
      batterylessEnabled: false,
      favoriteEvents: [],
      customColorsWhite: "#FFFFFF",
      customColorsLight: "#AAAAAA",
      customColorsDark: "#555555",
      customColorsBlack: "#000000",
      customControlsUp: [],
      customControlsDown: [],
      customControlsLeft: [],
      customControlsRight: [],
      customControlsA: [],
      customControlsB: [],
      customControlsStart: [],
      customControlsSelect: [],
      debuggerEnabled: false,
      debuggerScriptType: "editor",
      debuggerVariablesFilter: "all",
      debuggerCollapsedPanes: [],
      debuggerPauseOnScriptChanged: false,
      debuggerPauseOnWatchedVariableChanged: false,
      debuggerBreakpoints: [],
      debuggerWatchedVariables: [],
      colorMode: "mono",
      previewAsMono: false,
      openBuildLogOnWarnings: true,
      generateDebugFilesEnabled: false,
    };

    expect(() => Value.Decode(SettingsResource, validSettings)).not.toThrow();
    expect(() => Value.Decode(SettingsResource, invalidSettings)).toThrow();
  });

  it("should validate VariableData", () => {
    const validVariable = { id: "var1", name: "Variable 1", symbol: "symbol" };
    const invalidVariable = { id: "var1", name: "Variable 1" };

    expect(() => Value.Decode(VariableData, validVariable)).not.toThrow();
    expect(() => Value.Decode(VariableData, invalidVariable)).toThrow();
  });

  it("should validate VariablesResource", () => {
    const validVariables = {
      _resourceType: "variables",
      variables: [{ id: "var1", name: "Variable 1", symbol: "symbol" }],
      constants: [],
    };
    const invalidVariables = {
      _resourceType: "variables",
      variables: [{ id: "var1", name: "Variable 1" }],
      constants: [],
    };

    expect(() => Value.Decode(VariablesResource, validVariables)).not.toThrow();
    expect(() => Value.Decode(VariablesResource, invalidVariables)).toThrow();
  });

  it("should validate EngineFieldValueData", () => {
    const validField = { id: "field1", value: "someValue" };
    const invalidField = { id: "field1", value: [] };

    expect(() => Value.Decode(EngineFieldValueData, validField)).not.toThrow();
    expect(() => Value.Decode(EngineFieldValueData, invalidField)).toThrow();
  });

  it("should validate EngineFieldValuesResource", () => {
    const validFieldValues = {
      _resourceType: "engineFieldValues",
      engineFieldValues: [{ id: "field1", value: "someValue" }],
    };
    const invalidFieldValues = {
      _resourceType: "engineFieldValues",
      engineFieldValues: [{ id: "field1", value: [] }],
    };

    expect(() =>
      Value.Decode(EngineFieldValuesResource, validFieldValues),
    ).not.toThrow();
    expect(() =>
      Value.Decode(EngineFieldValuesResource, invalidFieldValues),
    ).toThrow();
  });

  it("should validate MetadataResource", () => {
    const validMetadata = {
      _resourceType: "project",
      name: "My Project",
      author: "Author Name",
      notes: "Some notes",
      _version: "1.0.0",
      _release: "1.0.0",
    };
    const invalidMetadata = {
      name: "My Project",
      author: "Author Name",
      notes: "Some notes",
      _version: "1.0.0",
      _release: "1.0.0",
    };

    expect(isProjectMetadataResource(validMetadata)).toBe(true);
    expect(isProjectMetadataResource(invalidMetadata)).toBe(false);
  });
});
