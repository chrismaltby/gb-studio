#pragma bank=10

#include <stdio.h>
#include <stdlib.h>
#include "game.h"
#include "Scene.h"
#include "UI.h"
#include "BankData.h"
#include "FadeManager.h"
#include "SpriteHelpers.h"
#include "Macros.h"
#include "data_ptrs.h"
#include "banks.h"

UINT8 scene_bank = 10;

static void SceneHandleInput();
void SceneRender();

////////////////////////////////////////////////////////////////////////////////
// Private vars
////////////////////////////////////////////////////////////////////////////////
#pragma region private vars

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Private functions
////////////////////////////////////////////////////////////////////////////////
#pragma region private functions

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Initialise
////////////////////////////////////////////////////////////////////////////////
#pragma region initialise

void SceneInit_b()
{
  UWORD sceneIndex, imageIndex;
  BANK_PTR bank_ptr;
  UWORD ptr;
  UBYTE tilesetIndex, width, height;

  DISPLAY_OFF;

  SpritesReset();

  SCX_REG = 0;
  SCY_REG = 0;
  WX_REG = MAXWNDPOSX;
  WY_REG = MAXWNDPOSY;

  sceneIndex = 20;

  // Load scene
  ReadBankedBankPtr(16, &bank_ptr, &scene_bank_ptrs[sceneIndex]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  imageIndex = ReadBankedUWORD(bank_ptr.bank, ptr);

  // Load Image Tiles - V3 pointer to bank_ptr (31000) (42145)
  ReadBankedBankPtr(16, &bank_ptr, &image_bank_ptrs[imageIndex]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  tilesetIndex = ReadBankedUBYTE(bank_ptr.bank, ptr);
  width = ReadBankedUBYTE(bank_ptr.bank, ptr+1u);
  height = ReadBankedUBYTE(bank_ptr.bank, ptr+2u);
  SetBankedBkgTiles(bank_ptr.bank, 0, 0, width, height, ptr+3u);

  // Load Image Tileset
  ReadBankedBankPtr(16, &bank_ptr, &tileset_bank_ptrs[tilesetIndex]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  SetBankedBkgData(bank_ptr.bank, 0, 190, ptr);

  FadeIn();

  DISPLAY_ON;
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Update
////////////////////////////////////////////////////////////////////////////////
#pragma region update

void SceneUpdate_b()
{
  SceneHandleInput();
  SceneRender();
}

////////////////////////////////////////////////////////////////////////////////
// Input
////////////////////////////////////////////////////////////////////////////////
#pragma region input

static void SceneHandleInput()
{
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Render
////////////////////////////////////////////////////////////////////////////////
#pragma region render

void SceneRender()
{
}

#pragma endregion

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////
#pragma region helpers

#pragma endregion
