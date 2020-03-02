#include "DataManager.h"
#include "BankManager.h"
#include "data_ptrs.h"
#include "Actor.h"
#include "Trigger.h"
#include "Scroll.h"
#include "Sprite.h"

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
UBYTE collisions_len;
UBYTE palettes_len;
UBYTE scene_type;
BankPtr scene_events_start_ptr;

void LoadTiles(UINT16 index)
{
    UBYTE bank, size;
    UBYTE *data_ptr;

    PUSH_BANK(DATA_PTRS_BANK);
    bank = tileset_bank_ptrs[index].bank;
    data_ptr = (UBYTE *)(tileset_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    POP_BANK;

    PUSH_BANK(bank);
    size = *(data_ptr++);
    set_bkg_data(0, size, data_ptr);
    POP_BANK;
}

void LoadUI()
{
    UBYTE *data_ptr;

    PUSH_BANK(DATA_PTRS_BANK);
    data_ptr = ((UBYTE *)bank_data_ptrs[FRAME_BANK]) + FRAME_BANK_OFFSET;
    POP_BANK;

    PUSH_BANK(FRAME_BANK);
    set_bkg_data(192, 9, data_ptr);
    POP_BANK;

    // @todo REMOVE FROM HERE
    PUSH_BANK(DATA_PTRS_BANK);
    data_ptr = ((UBYTE *)bank_data_ptrs[FONT_BANK]) + FONT_BANK_OFFSET;
    POP_BANK;

    PUSH_BANK(FONT_BANK);
    set_bkg_data(203, 64, data_ptr + 256);
    // set_bkg_data(201, 64, data_ptr);
    POP_BANK;
    // @todo REMOVE TO HERE
}

void LoadImage(UINT16 index)
{
    UBYTE *data_ptr;

    PUSH_BANK(DATA_PTRS_BANK);
    image_bank = background_bank_ptrs[index].bank;
    data_ptr = (UBYTE *)(background_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[image_bank]));
    POP_BANK;

    PUSH_BANK(image_bank);

    LoadTiles(*(data_ptr++));
    LoadPalette(0);

    image_tile_width = *(data_ptr++);
    image_tile_height = *(data_ptr++);
    image_width = image_tile_width * 8;
    image_height = image_tile_height * 8;
    image_ptr = data_ptr;

    LoadImageAttr(index);

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
    UBYTE *data_ptr, *p0, *p1, *p2, *p3, *p4, *p5, *p6, *p7;

    PUSH_BANK(DATA_PTRS_BANK);
    bank = palette_bank_ptrs[index].bank;
    palette_info = (struct TilePaletteInfo *)(palette_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    data_ptr = (UBYTE *)(palette_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    POP_BANK;

    p7 = data_ptr;
    data_ptr += 8;
    p6 = data_ptr;
    data_ptr += 8;
    p5 = data_ptr;
    data_ptr += 8;
    p4 = data_ptr;
    data_ptr += 8;
    p3 = data_ptr;
    data_ptr += 8;
    p2 = data_ptr;
    data_ptr += 8;
    p1 = data_ptr;
    data_ptr += 8;
    p0 = data_ptr;

    PUSH_BANK(bank);
#ifdef CGB
    set_bkg_palette(7, 1, p0);
    set_bkg_palette(6, 1, p6);
    set_bkg_palette(5, 1, p5);
    set_bkg_palette(4, 1, p4);
    set_bkg_palette(3, 1, p3);
    set_bkg_palette(2, 1, p2);
    set_bkg_palette(1, 1, p1);
    set_bkg_palette(0, 1, p0);
    image_attr_ptr += 64;
#endif
    POP_BANK;
}

UBYTE LoadSprite(UINT16 index, UBYTE sprite_offset)
{
    UBYTE bank, size;
    UBYTE *data_ptr;

    // struct SpriteInfo *sprite_info;

    // LOG("LOAD SPRITE %u\n", index);

    PUSH_BANK(DATA_PTRS_BANK);
    bank = sprite_bank_ptrs[index].bank;
    data_ptr = (UBYTE *)(sprite_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[bank]));
    POP_BANK;

    PUSH_BANK(bank);
    size = *(data_ptr++) * 4;
    // LOG("SPRITE WAS SIZE %u\n", size);
    set_sprite_data(sprite_offset, size, data_ptr);
    POP_BANK;

    return size;
}

void LoadScene(UINT16 index)
{
    UBYTE bank, i, k;
    UBYTE *data_ptr;
    UWORD backgroundIndex;
    BANK_PTR sprite_bank_ptr;
    UWORD sprite_ptr;
    UBYTE sprite_frames, sprite_len;

    // LOG("LOAD SCENE %u\n", index);

    PUSH_BANK(DATA_PTRS_BANK);
    bank = scene_bank_ptrs[index].bank;
    // LOG("SCENE BANK %u\n", bank);

    // LOG("SIZE UBYTE=%u UWORD=%u\n", sizeof(UBYTE), sizeof(UWORD));

    // LOG("LOAD SCENE %u, offset=%u ptr=%u\n", index, scene_bank_ptrs[index].offset, bank_data_ptrs[bank]);
    data_ptr = (scene_bank_ptrs[index].offset + ((UBYTE *)bank_data_ptrs[bank]));

    collision_bank = collision_bank_ptrs[index].bank;
    collision_ptr = (unsigned char *)(collision_bank_ptrs[index].offset + ((unsigned char *)bank_data_ptrs[collision_bank]));
    POP_BANK;

    backgroundIndex = 2; //scene_info->backgroundIndex;

    SpritePoolReset();

    PUSH_BANK(bank);
    LoadImage(*(data_ptr++));
    // LoadImage(0);
    data_ptr++; // scene_image was UWORD

    // LOG("LOAD REST OF SCENE %u\n", index);

    scene_type = (*(data_ptr++)) + 1;
    sprites_len = *(data_ptr++);
    actors_len = (*(data_ptr++)) + 1;
    triggers_len = *(data_ptr++);
    collisions_len = *(data_ptr++);
    palettes_len = *(data_ptr++);

    scene_events_start_ptr.bank = *(data_ptr++);
    scene_events_start_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

    LOG("LOAD SCENE scene_events_start_ptr.offset: %d\n", scene_events_start_ptr.offset);

    // LOG("LOAD SCENE triggers_len: %u\n", triggers_len );
    // LOG("LOAD SCENE collisions_len: %u\n", collisions_len );
    // LOG("LOAD SCENE palettes_len: %u\n", palettes_len );

    // data_ptr = &scene_info->data;

    // LOG("LOAD scene B V1,2,3, [%u, %u,%u,%u,%u,%u,%u,%u,%u,%u]\n", test_ptr, *(test_ptr),*(test_ptr+1),*(test_ptr+2),*(test_ptr+3),*(test_ptr+4),*(test_ptr+5),*(test_ptr+6),*(test_ptr+7),*(test_ptr+8));

    // LOG("LOAD scene C, [%u, %u,%u,%u,%u,%u]\n", scene_type, sprites_len, actors_len, triggers_len, collisions_len, palettes_len);

    // LOG("LOAD SCENE SPRITES %u\n", sprites_len);
    // LOG("LOAD SCENE ACTORS %u\n", actors_len);
    // LOG("LOAD SIZEOF UBYTE %u\n", sizeof(UBYTE));

    // Load sprites
    k = 24;
    for (i = 0; i != sprites_len; i++)
    {
        // LOG("LOAD SPRITES i= %u\n", i);

        k += LoadSprite(*(data_ptr++), k);

        // LOG("K= %u\n", k);
        // sprites[i].pos.x = 32 + (i << 5);
        // sprites[i].pos.y = 64;
    }

    // Load actors
    for (i = 1; i != actors_len; i++)
    {
        UBYTE j;
        // LOG("LOAD ACTOR %u data_ptr=%u\n", i, data_ptr);

        // actor_info = (struct ActorInfo *)data_ptr;

        // test_ptr = data_ptr;
        // LOG("LOAD actor V1,2,3, [%u, %u,%u,%u,%u,%u,%u,%u,%u,%u]\n", test_ptr, *(test_ptr),*(test_ptr+1),*(test_ptr+2),*(test_ptr+3),*(test_ptr+4),*(test_ptr+5),*(test_ptr+6),*(test_ptr+7),*(test_ptr+8));

        actors[i].sprite = *(data_ptr++);
        actors[i].frame = 0;
        // actors[i].frames_len = actor_info->dirFrames;

        // actors[i].sprite = 0; // Unused
        actors[i].enabled = TRUE;
        actors[i].collisionsEnabled = TRUE;
        actors[i].moving = FALSE;

        actors[i].sprite_type = *(data_ptr++);
        actors[i].frames_len = *(data_ptr++);
        actors[i].frame_offset = *(data_ptr++);

        // actors[i].sprite_type = SPRITE_STATIC;
        // actors[i].animate = TRUE;
        // actors[i].frames_len = 4;
        actors[i].frames_len = 0;
        actors[i].frame_offset = 0;

        // LOG("LOAD ACTOR %u x=%u y=%u\n", i, actor_info->x, actor_info->y);

        // actors[i].pos.x = (*(data_ptr++) * 8);
        // actors[i].pos.y = (*(data_ptr++) * 8);

        actors[i].pos.x = *(data_ptr++) * 8;
        actors[i].pos.y = *(data_ptr++) * 8;
        // actors[i].move_speed

        j = *(data_ptr++);
        actors[i].dir.x = j == 2 ? -1 : j == 4 ? 1 : 0;
        actors[i].dir.y = j == 8 ? -1 : j == 1 ? 1 : 0;

        actors[i].movement_type = *(data_ptr++);
        actors[i].move_speed = *(data_ptr++);
        actors[i].anim_speed = *(data_ptr++);

        actors[i].events_ptr.bank = *(data_ptr++);
        actors[i].events_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);

        LOG("ACTOR %u bank=%u bank_offset=%d\n", i, actors[i].events_ptr.bank, actors[i].events_ptr.offset);
        LOG("LOAD ACTOR i=%u st=%u dx=%d dy=%d sprite=%u\n", i, actors[i].sprite_type, actors[i].dir.x, actors[i].dir.y, actors[i].sprite);

        // LOG("LOAD ACTOR %u x=%u y=%u\n", i, actors[i].pos.x,  actors[i].pos.y);

        // data_ptr ++;
    }

    actors_active[0] = 0;
    actors_active_size = 1;

    // Load triggers
    for (i = 0; i != triggers_len; i++)
    {
        LOG("LOAD TRIGGER\n");
        LOG("v1 = %u\n", *(data_ptr));
        triggers[i].x = *(data_ptr++);
        LOG("v2 = %u\n", *(data_ptr));
        triggers[i].y = *(data_ptr++);
        LOG("v3 = %u\n", *(data_ptr));
        triggers[i].w = *(data_ptr++);
        LOG("v4 = %u\n", *(data_ptr));
        triggers[i].h = *(data_ptr++);
        LOG("v5 = %u\n", *(data_ptr));
        data_ptr++; // Trigger type
        triggers[i].events_ptr.bank = *(data_ptr++);
        triggers[i].events_ptr.offset = *(data_ptr++) + (*(data_ptr++) * 256);
    }

    // Initialise player
    sprite_frames = DIV_4(LoadSprite(map_next_sprite, 0));
    player.enabled = TRUE;
    player.moving = FALSE;
    player.collisionsEnabled = TRUE;
    player.pos.x = map_next_pos.x;
    player.pos.y = map_next_pos.y;
    player.dir.x = map_next_dir.x;
    player.dir.y = map_next_dir.y;
    player.sprite_type = sprite_frames == 6 ? SPRITE_ACTOR_ANIMATED : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
    player.frames_len = sprite_frames == 6 ? 2 : sprite_frames == 3 ? 1 : sprite_frames;
    player.sprite_index = SpritePoolNext();

    InitScroll();

    POP_BANK;
}
