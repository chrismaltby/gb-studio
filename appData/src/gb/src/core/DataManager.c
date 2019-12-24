#include "DataManager.h"
#include "BankManager.h"
#include "data_ptrs.h"
#include "assets.h"
#include "BankData.h"
#include "Data.h"
#include "TopDown.h"
#include "Sprite.h"

BANK_PTR bank_ptr;

UBYTE image_bank;
unsigned char *image_ptr;
unsigned char *image_attr_ptr;
UBYTE image_tile_width;
UBYTE image_tile_height;
UINT16 image_width;
UINT16 image_height;
UBYTE sprites_len;
UBYTE actors_len;
UBYTE triggers_len;
UBYTE collisions_len;
UBYTE palettes_len;

void LoadTiles(UINT16 index)
{
    UBYTE bank;
    struct TilesInfo *tiles_info;

    PUSH_BANK(DATA_PTRS_BANK);
    bank = tileset_bank_ptrs[index].bank;
    tiles_info = (struct TilesInfo *)(tileset_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    POP_BANK;

    PUSH_BANK(bank);
    set_bkg_data(0, tiles_info->size, &tiles_info->data);
    POP_BANK;
}

void LoadImage(UINT16 index)
{
    UBYTE i;
    struct BackgroundInfo *background_info;
    struct TilePaletteInfo *palette_info;

    PUSH_BANK(DATA_PTRS_BANK);
    image_bank = background_bank_ptrs[index].bank;
    background_info = (struct BackgroundInfo *)(background_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[image_bank]));
    POP_BANK;

    PUSH_BANK(image_bank);

    LoadTiles(background_info->tileIndex);

    image_tile_width = background_info->width;
    image_tile_height = background_info->height;
    image_width = background_info->width * 8;
    image_height = background_info->height * 8;

    image_ptr = &background_info->data;

#ifdef CGB
    image_attr_ptr = image_ptr + (image_tile_height * image_tile_width);
    palette_info = (struct TilePaletteInfo *)image_attr_ptr;
    set_bkg_palette(7, 1, palette_info->p7);
    set_bkg_palette(6, 1, palette_info->p6);
    set_bkg_palette(5, 1, palette_info->p5);
    set_bkg_palette(4, 1, palette_info->p4);
    set_bkg_palette(3, 1, palette_info->p3);
    set_bkg_palette(2, 1, palette_info->p2);
    set_bkg_palette(1, 1, palette_info->p1);
    set_bkg_palette(0, 1, palette_info->p0);
    image_attr_ptr += 64;
#endif

    for (i = 0; i != 20; i++)
    {
#ifdef CGB
        VBK_REG = 1;
        set_bkg_tiles(0, i, 22, 1, image_attr_ptr + (i * image_tile_width));
        VBK_REG = 0;
#endif
        set_bkg_tiles(0, i, 22, 1, image_ptr + (i * image_tile_width));
    }

    POP_BANK;
}

UBYTE LoadSprite(UINT16 index, UBYTE sprite_offset)
{
    UBYTE bank, size;
    struct SpriteInfo *sprite_info;

    PUSH_BANK(DATA_PTRS_BANK);
    bank = sprite_bank_ptrs[index].bank;
    sprite_info = (struct SpriteInfo *)(sprite_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    POP_BANK;

    PUSH_BANK(bank);
    size = sprite_info->size * 4;
    set_sprite_data(sprite_offset, size, &sprite_info->data);
    POP_BANK;   

    return size; 
}

void LoadScene(UINT16 index)
{
    UBYTE bank, i, k;
    struct SceneInfo *scene_info;
    unsigned char *data_ptr;

    PUSH_BANK(DATA_PTRS_BANK);
    bank = scene_bank_ptrs[index].bank;
    scene_info = (struct SceneInfo *)(scene_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    POP_BANK;

    PUSH_BANK(bank);
    LoadImage(scene_info->backgroundIndex);
    sprites_len = scene_info->spritesLength;
    actors_len = scene_info->actorsLength;
    triggers_len = scene_info->triggersLength;
    collisions_len = scene_info->collisionsLength;
    palettes_len = scene_info->palettesLength;
    data_ptr = &scene_info->data;

    // Load sprites
    k = 0;
    for (i = 0; i != sprites_len; i++)
    {  
        k += LoadSprite(*data_ptr, k);
        data_ptr++;
        sprites[i].pos.x = 32 + (i<<5);
        sprites[i].pos.y = 64;
    }

    POP_BANK;
}
