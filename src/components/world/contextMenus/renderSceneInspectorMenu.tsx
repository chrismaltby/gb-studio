import React from "react";
import l10n from "shared/lib/lang/l10n";
import type { SceneNormalized } from "shared/lib/entities/entitiesTypes";
import { labelColorValues } from "shared/lib/resources/types";
import {
  ClipboardTypePaletteIds,
  ClipboardTypeScenes,
} from "store/features/clipboard/clipboardTypes";
import { LabelButton } from "ui/buttons/LabelButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

interface SceneInspectorMenuProps {
  compact: boolean;
  colorsEnabled: boolean;
  clipboardFormat?: string;
  showNotes: boolean;
  showSymbols: boolean;
  showColorModeOverride: boolean;
  canAutoTileFlip: boolean;
  showAutoTileFlipOverride: boolean;
  showSpriteModeOverride: boolean;
  onChangeLabelColor: (color: SceneNormalized["labelColor"]) => void;
  onAddNotes: () => void;
  onShowSymbols: () => void;
  onOverrideColorMode: () => void;
  onOverrideAutoTileFlip: () => void;
  onOverrideSpriteMode: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCopyBackgroundPaletteIds: () => void;
  onCopySpritePaletteIds: () => void;
  onPasteBackgroundPaletteIds: () => void;
  onPasteSpritePaletteIds: () => void;
  onRemove: () => void;
}

const renderSceneInspectorMenu = ({
  compact,
  colorsEnabled,
  clipboardFormat,
  showNotes,
  showSymbols,
  showColorModeOverride,
  canAutoTileFlip,
  showAutoTileFlipOverride,
  showSpriteModeOverride,
  onChangeLabelColor,
  onAddNotes,
  onShowSymbols,
  onOverrideColorMode,
  onOverrideAutoTileFlip,
  onOverrideSpriteMode,
  onCopy,
  onPaste,
  onCopyBackgroundPaletteIds,
  onCopySpritePaletteIds,
  onPasteBackgroundPaletteIds,
  onPasteSpritePaletteIds,
  onRemove,
}: SceneInspectorMenuProps): React.ReactNode[] => [
  <MenuItem key="label" style={{ paddingRight: 10, marginBottom: 5 }}>
    <div style={{ display: "flex" }}>
      <div style={{ marginRight: 5 }}>
        <LabelButton onClick={() => onChangeLabelColor(undefined)} />
      </div>
      {labelColorValues.map((color) => (
        <div key={color} style={{ marginRight: color === "gray" ? 0 : 5 }}>
          <LabelButton
            color={color}
            onClick={() => onChangeLabelColor(color)}
          />
        </div>
      ))}
    </div>
  </MenuItem>,
  <MenuDivider key="div-options" />,
  ...(!compact && !showNotes
    ? [
        <MenuItem key="notes" onClick={onAddNotes}>
          {l10n("FIELD_ADD_NOTES")}
        </MenuItem>,
      ]
    : []),
  ...(!compact && !showSymbols
    ? [
        <MenuItem key="symbols" onClick={onShowSymbols}>
          {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
        </MenuItem>,
      ]
    : []),
  ...(!compact && !showColorModeOverride && colorsEnabled
    ? [
        <MenuItem key="colorMode" onClick={onOverrideColorMode}>
          {l10n("FIELD_SET_COLOR_MODE_OVERRIDE")}
        </MenuItem>,
      ]
    : []),
  ...(!compact && canAutoTileFlip && !showAutoTileFlipOverride
    ? [
        <MenuItem key="autoTileFlip" onClick={onOverrideAutoTileFlip}>
          {l10n("FIELD_SET_AUTO_TILE_FLIP_OVERRIDE")}
        </MenuItem>,
      ]
    : []),
  ...(!compact && !showSpriteModeOverride
    ? [
        <MenuItem key="spriteMode" onClick={onOverrideSpriteMode}>
          {l10n("FIELD_SET_SPRITE_MODE_OVERRIDE")}
        </MenuItem>,
      ]
    : []),
  <MenuDivider key="div-copy" />,
  <MenuItem key="copy" onClick={onCopy}>
    {l10n("MENU_COPY_SCENE")}
  </MenuItem>,
  ...(clipboardFormat === ClipboardTypeScenes
    ? [
        <MenuItem key="paste" onClick={onPaste}>
          {l10n("MENU_PASTE_SCENE")}
        </MenuItem>,
      ]
    : []),
  <MenuDivider key="div-palettes" />,
  ...(colorsEnabled
    ? [
        <MenuItem key="copyBgPalettes" onClick={onCopyBackgroundPaletteIds}>
          {l10n("FIELD_COPY_BACKGROUND_PALETTES")}
        </MenuItem>,
        <MenuItem key="copySpritePalettes" onClick={onCopySpritePaletteIds}>
          {l10n("FIELD_COPY_SPRITE_PALETTES")}
        </MenuItem>,
      ]
    : []),
  ...(colorsEnabled && clipboardFormat === ClipboardTypePaletteIds
    ? [
        <MenuItem key="pasteBgPalettes" onClick={onPasteBackgroundPaletteIds}>
          {l10n("FIELD_PASTE_BACKGROUND_PALETTES")}
        </MenuItem>,
        <MenuItem key="pasteSpritePalettes" onClick={onPasteSpritePaletteIds}>
          {l10n("FIELD_PASTE_SPRITE_PALETTES")}
        </MenuItem>,
      ]
    : []),
  ...(colorsEnabled ? [<MenuDivider key="div-delete" />] : []),
  <MenuItem key="delete" onClick={onRemove}>
    {l10n("MENU_DELETE_SCENE")}
  </MenuItem>,
];

export default renderSceneInspectorMenu;
