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
  BANK_PTR bank_ptr, sprite_bank_ptr;
  UWORD ptr, sprite_ptr;
  UBYTE i, tilesetIndex, tilesetSize, width, height, numSprites, spriteIndex;
  UBYTE k, j, sprite_len, numActors;

  DISPLAY_OFF;

  SpritesReset();

  SCX_REG = 0;
  SCY_REG = 0;
  WX_REG = MAXWNDPOSX;
  WY_REG = MAXWNDPOSY;

  // sceneIndex = 42;
  sceneIndex = 12;

  // Load scene
  ReadBankedBankPtr(16, &bank_ptr, &scene_bank_ptrs[sceneIndex]);
  ptr = ((UWORD)bank_data_ptrs[bank_ptr.bank]) + bank_ptr.offset;
  imageIndex = ReadBankedUWORD(bank_ptr.bank, ptr);
  numSprites = ReadBankedUBYTE(bank_ptr.bank, ptr+2);
  // x = ReadBankedUBYTE(bank_ptr.bank, ptr+3);
  // y = ReadBankedUBYTE(bank_ptr.bank, ptr+4);
  // z = ReadBankedUBYTE(bank_ptr.bank, ptr+5);
  // p = ReadBankedUBYTE(bank_ptr.bank, ptr+6);

  // LOG("NUMSPRITES=%u\n",numSprites);
  // LOG("X=%u\n",x);
  // LOG("Y=%u\n",y);
  // LOG("Z=%u\n",z);
  // LOG("P=%u\n",p);

  // Load sprites
  k = 24;
  ptr = ptr + 3;
  for (i = 0; i != numSprites; i++) {
    LOG("LOAD SPRITE=%u k=%u\n",i,k);
    spriteIndex = ReadBankedUBYTE(bank_ptr.bank, ptr + i);
    LOG("SPRITE INDEX=%u\n",spriteIndex);
    ReadBankedBankPtr(16, &sprite_bank_ptr, &sprite_bank_ptrs[spriteIndex]);
    sprite_ptr = ((UWORD)bank_data_ptrs[sprite_bank_ptr.bank]) + sprite_bank_ptr.offset;
    sprite_len = ReadBankedUBYTE(sprite_bank_ptr.bank, sprite_ptr) << 2;
    LOG("SPRITE LEN=%u\n",sprite_len);
    SetBankedSpriteData(sprite_bank_ptr.bank, k, sprite_len, sprite_ptr+1);
    k += sprite_len;
  }

  // Load actors
  ptr = ptr + numSprites;
  numActors = ReadBankedUBYTE(bank_ptr.bank, ptr);
  ptr = ptr + 1;
  LOG("NUM ACTORS=%u\n",numActors);
  for (i = 1; i != numActors + 1; i++) {
    LOG("LOAD ACTOR %u\n", i);
    actors[i].sprite = ReadBankedUBYTE(bank_ptr.bank, ptr);
    LOG("ACTOR_SPRITE=%u\n", actors[i].sprite);
    actors[i].redraw = TRUE;
    actors[i].enabled = TRUE;
    actors[i].animated = FALSE; // WTF needed 
    actors[i].animated = ReadBankedUBYTE(bank_ptr.bank, ptr+1);
    actors[i].pos.x = (ReadBankedUBYTE(bank_ptr.bank, ptr+2) << 3) + 8;
    actors[i].pos.y = (ReadBankedUBYTE(bank_ptr.bank, ptr+3) << 3) + 8;
    j = ReadBankedUBYTE(bank_ptr.bank, ptr+4);
    actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
    actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;
    actors[i].movement_type = 0;        // WTF needed        
    actors[i].movement_type = ReadBankedUBYTE(bank_ptr.bank, ptr+5);
    LOG("ACTOR_POS [%u,%u]\n", actors[i].pos.x, actors[i].pos.y);
    actors[i].events_ptr.bank = ReadBankedUBYTE(bank_ptr.bank, ptr+6);
    actors[i].events_ptr.offset = (ReadBankedUBYTE(bank_ptr.bank, ptr+7) * 0xFFu) + ReadBankedUBYTE(bank_ptr.bank, ptr+8);
    LOG("ACTOR_EVENT_PTR BANK=%u OFFSET=%u\n", actors[i].events_ptr.bank, actors[i].events_ptr.offset);
    ptr = ptr + 9u;
  }

  // Load Player Sprite
  SetBankedSpriteData(3, 0, 24, village_sprites);

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
  tilesetSize = ReadBankedUBYTE(bank_ptr.bank, ptr);
  SetBankedBkgData(bank_ptr.bank, 0, tilesetSize, ptr+1u);

  // Init player
  actors[0].redraw = TRUE;
  actors[0].pos.x = 20;
  actors[0].pos.y = 20;
  actors[0].dir.x = 1;
  actors[0].dir.y = 0;
  actors[0].moving = FALSE;

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
