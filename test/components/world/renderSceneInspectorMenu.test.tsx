/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "../../react-utils";
import renderSceneInspectorMenu from "components/world/contextMenus/renderSceneInspectorMenu";

const callbacks = () => ({
  onChangeLabelColor: jest.fn(),
  onAddNotes: jest.fn(),
  onShowSymbols: jest.fn(),
  onOverrideColorMode: jest.fn(),
  onOverrideAutoTileFlip: jest.fn(),
  onOverrideSpriteMode: jest.fn(),
  onCopy: jest.fn(),
  onPaste: jest.fn(),
  onCopyBackgroundPaletteIds: jest.fn(),
  onCopySpritePaletteIds: jest.fn(),
  onPasteBackgroundPaletteIds: jest.fn(),
  onPasteSpritePaletteIds: jest.fn(),
  onRemove: jest.fn(),
});

const renderMenu = (compact: boolean) => {
  const handlers = callbacks();
  render(
    <>
      {renderSceneInspectorMenu({
        compact,
        colorsEnabled: true,
        clipboardFormat: "scenes",
        showNotes: false,
        showSymbols: false,
        showColorModeOverride: false,
        canAutoTileFlip: true,
        showAutoTileFlipOverride: false,
        showSpriteModeOverride: false,
        ...handlers,
      })}
    </>,
  );
  return handlers;
};

test("compact menu keeps common actions and omits inspector options", () => {
  const handlers = renderMenu(true);

  expect(screen.queryByText("FIELD_ADD_NOTES")).not.toBeInTheDocument();
  expect(screen.queryByText("FIELD_VIEW_GBVM_SYMBOLS")).not.toBeInTheDocument();
  expect(screen.getByText("MENU_COPY_SCENE")).toBeInTheDocument();
  expect(screen.getByText("MENU_DELETE_SCENE")).toBeInTheDocument();

  fireEvent.click(screen.getByText("MENU_COPY_SCENE"));
  expect(handlers.onCopy).toHaveBeenCalledTimes(1);
});

test("full menu includes inspector-specific options", () => {
  const handlers = renderMenu(false);

  fireEvent.click(screen.getByText("FIELD_ADD_NOTES"));
  fireEvent.click(screen.getByText("FIELD_VIEW_GBVM_SYMBOLS"));
  fireEvent.click(screen.getByText("FIELD_SET_COLOR_MODE_OVERRIDE"));
  fireEvent.click(screen.getByText("FIELD_SET_AUTO_TILE_FLIP_OVERRIDE"));
  fireEvent.click(screen.getByText("FIELD_SET_SPRITE_MODE_OVERRIDE"));

  expect(handlers.onAddNotes).toHaveBeenCalledTimes(1);
  expect(handlers.onShowSymbols).toHaveBeenCalledTimes(1);
  expect(handlers.onOverrideColorMode).toHaveBeenCalledTimes(1);
  expect(handlers.onOverrideAutoTileFlip).toHaveBeenCalledTimes(1);
  expect(handlers.onOverrideSpriteMode).toHaveBeenCalledTimes(1);
});
