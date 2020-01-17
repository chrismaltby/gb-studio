#include "DataManager.h"
#include "BankManager.h"
#include "data_ptrs.h"
#include "assets.h"
#include "BankData.h"
#include "Data.h"
#include "TopDown.h"
#include "Sprite.h"
#include "Actor.h"

BANK_PTR bank_ptr;

UBYTE image_bank;
UBYTE image_attr_bank;
UBYTE collision_bank;
unsigned char *image_ptr;
unsigned char *image_attr_ptr;
unsigned char *collision_ptr;
UBYTE image_tile_width;
UBYTE image_tile_height;
UINT16 image_width;
UINT16 image_height;
UBYTE sprites_len;
UBYTE actors_len;
UBYTE triggers_len;
UBYTE collisions_len;
UBYTE palettes_len;
UBYTE scene_type;

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

    PUSH_BANK(DATA_PTRS_BANK);
    image_bank = background_bank_ptrs[index].bank;
    background_info = (struct BackgroundInfo *)(background_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[image_bank]));
    POP_BANK;

    PUSH_BANK(image_bank);

    LoadTiles(background_info->tileIndex);
    LoadPalette(0);

    image_tile_width = background_info->width;
    image_tile_height = background_info->height;
    image_width = background_info->width * 8;
    image_height = background_info->height * 8;

    image_ptr = &background_info->data;

    LoadImageAttr(index);

    for (i = 0; i != 21; i++)
    {
        set_bkg_tiles(0, i, 22, 1, image_ptr + (i * image_tile_width));
    }

    POP_BANK;
}

void LoadImageAttr(UINT16 index)
{
    UBYTE i;

    PUSH_BANK(DATA_PTRS_BANK);
    image_attr_bank = background_attr_bank_ptrs[index].bank;
    image_attr_ptr = (unsigned char *)(background_attr_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[image_attr_bank]));
    POP_BANK;

    PUSH_BANK(image_attr_bank);
#ifdef CGB
    VBK_REG = 1;
    for (i = 0; i != 21; i++)
    {
        set_bkg_tiles(0, i, 22, 1, image_attr_ptr + (i * image_tile_width));
    }
    VBK_REG = 0;    
#endif
    POP_BANK;
}

void LoadPalette(UINT16 index)
{
    UBYTE bank;
    struct TilePaletteInfo *palette_info;

    PUSH_BANK(DATA_PTRS_BANK);
    bank = palette_bank_ptrs[index].bank;
    palette_info = (struct TilePaletteInfo *)(palette_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    POP_BANK;

    PUSH_BANK(bank);
#ifdef CGB
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
    struct ActorInfo *actor_info;
    unsigned char *data_ptr;

    PUSH_BANK(DATA_PTRS_BANK);
    bank = scene_bank_ptrs[index].bank;
    scene_info = (struct SceneInfo *)(scene_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    
    collision_bank = collision_bank_ptrs[index].bank;
    collision_ptr = (unsigned char *)(collision_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[collision_bank]));
    POP_BANK;

    PUSH_BANK(bank);
    LoadImage(scene_info->backgroundIndex);
    scene_type = scene_info->sceneType;
    sprites_len = scene_info->spritesLength;
    actors_len = scene_info->actorsLength;
    triggers_len = scene_info->triggersLength;
    collisions_len = scene_info->collisionsLength;
    palettes_len = scene_info->palettesLength;
    data_ptr = &scene_info->data;

    // Load sprites
    k = 24;
    for (i = 0; i != sprites_len; i++)
    {
        k += LoadSprite(*data_ptr, k);
        data_ptr++;
        sprites[i].pos.x = 32 + (i << 5);
        sprites[i].pos.y = 64;
    }

    // Load actors
    for (i = 0; i != actors_len; i++)
    {
        actor_info = (struct ActorInfo *)data_ptr;

        actors[i].pos.x = ((actor_info->x) << 3);
        actors[i].pos.y = (actor_info->y * 8);

        actors[i].pos.x = 8 + ((actor_info->x) << 3);
        actors[i].pos.y = (actor_info->y * 8) + 8u;
        // actors[i].frame = actor_info->spriteOffset;
        actors[i].frame = actor_info->spriteOffset;
        actors[i].frames_len = actor_info->dirFrames;

        actors[i].sprite = i;
        actors[i].enabled = TRUE;
        actors[i].collisionsEnabled = TRUE;
        actors[i].moving = FALSE;

        actors[i].sprite_type = actor_info->spriteType;
        actors[i].frames_len = actor_info->dirFrames;

        actors[i].pos.x = ((actor_info->x) << 3);
        actors[i].pos.y = (actor_info->y * 8);
        data_ptr += sizeof(struct ActorInfo);
    }

    actors_active[0] = 0;
    actors_active[1] = 1;
    actors_active[2] = 2;
    actors_active[3] = 3;
    actors_active[4] = 4;
    actors_active[5] = 5;
    actors_active[6] = 6;
    actors_active[7] = 7;
    actors_active[8] = 8;
    actors_active_size = 8;
    // Load triggers

    // Load collisions

    // Initialise player position
    actors[0].enabled = TRUE;
    actors[0].moving = FALSE;
    actors[0].collisionsEnabled = TRUE;
    actors[0].pos.x = map_next_pos.x;
    actors[0].pos.y = map_next_pos.y;
    actors[0].dir.x = map_next_dir.x;
    actors[0].dir.y = map_next_dir.y;

    POP_BANK;
}
