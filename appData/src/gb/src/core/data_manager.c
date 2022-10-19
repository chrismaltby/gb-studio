#pragma bank 255

#include <string.h>

#include "system.h"
#include "vm.h"
#include "data_manager.h"
#include "linked_list.h"
#include "actor.h"
#include "projectiles.h"
#include "scroll.h"
#include "trigger.h"
#include "camera.h"
#include "ui.h"
#include "palette.h"
#include "data/spritesheet_none.h"
#include "data/data_bootstrap.h"

#define ALLOC_BKG_TILES_TOWARDS_SPR

#define EMOTE_SPRITE            124
#define EMOTE_SPRITE_SIZE       4

far_ptr_t current_scene;

UBYTE image_bank;
unsigned char* image_ptr;

UBYTE image_attr_bank;
unsigned char* image_attr_ptr;

UBYTE collision_bank;
unsigned char* collision_ptr;

UBYTE image_tile_width;
UBYTE image_tile_height;
UINT16 image_width;
UINT16 image_height;
UBYTE sprites_len;
UBYTE actors_len;
UBYTE projectiles_len;
UBYTE player_sprite_len;
scene_type_e scene_type;
LCD_isr_e scene_LCD_type;

const far_ptr_t spritesheet_none_far = TO_FAR_PTR_T(spritesheet_none);

scene_stack_item_t scene_stack[SCENE_STACK_SIZE];
scene_stack_item_t * scene_stack_ptr;

UBYTE scene_sprites_base_tiles[MAX_SCENE_SPRITES];

void load_init() BANKED {
    actors_len = 0;
    player_sprite_len = 0;
    scene_stack_ptr = scene_stack;
}

void load_bkg_tileset(const tileset_t* tiles, UBYTE bank) BANKED {
    if ((!bank) || (!tiles)) return;

    UWORD n_tiles = ReadBankedUWORD(&(tiles->n_tiles), bank);

    // load first background chunk, align to zero tile
    UBYTE * data = tiles->tiles;
    if (n_tiles < 128) {
        if ((UBYTE)n_tiles) SetBankedBkgData(0, n_tiles, data, bank);
        return;
    }
    SetBankedBkgData(0, 128, data, bank);
    n_tiles -= 128; data += 128 * 16;

    // load second background chunk
    if (n_tiles < 128) {
        if (n_tiles < 65) {
            #ifdef ALLOC_BKG_TILES_TOWARDS_SPR
                // new allocation style, align to 192-th tile
                if ((UBYTE)n_tiles) SetBankedBkgData(192 - n_tiles, n_tiles, data, bank);
            #else
                // old allocation style, align to 128-th tile
                if ((UBYTE)n_tiles) SetBankedBkgData(128, n_tiles, data, bank);
            #endif
        } else {
            // if greater than 64 allow overflow into UI, align to 128-th tile
            if ((UBYTE)n_tiles) SetBankedBkgData(128, n_tiles, data, bank);
        }
        return;
    }
    SetBankedBkgData(128, 128, data, bank);
    n_tiles -= 128; data += 128 * 16;

    // if more than 256 - then it's a 360-tile logo, load rest to sprite area
    if ((UBYTE)n_tiles) SetBankedSpriteData(0, n_tiles, data, bank);
}

void load_background(const background_t* background, UBYTE bank) BANKED {
    background_t bkg;
    MemcpyBanked(&bkg, background, sizeof(bkg), bank);

    image_bank = bkg.tilemap.bank;
    image_ptr = bkg.tilemap.ptr;

    image_attr_bank = bkg.cgb_tilemap_attr.bank;
    image_attr_ptr = bkg.cgb_tilemap_attr.ptr;

    image_tile_width = bkg.width;
    image_tile_height = bkg.height;
    image_width = image_tile_width * 8;
    scroll_x_max = image_width - ((UINT16)SCREENWIDTH);
    image_height = image_tile_height * 8;
    scroll_y_max = image_height - ((UINT16)SCREENHEIGHT);

    load_bkg_tileset(bkg.tileset.ptr, bkg.tileset.bank);
#ifdef CGB
    if ((_is_CGB) && (bkg.cgb_tileset.ptr)) {
        VBK_REG = 1;
        load_bkg_tileset(bkg.cgb_tileset.ptr, bkg.cgb_tileset.bank);
        VBK_REG = 0;
    }
#endif
}

inline UBYTE load_sprite_tileset(UBYTE base_tile, const tileset_t * tileset, UBYTE bank) {
    UBYTE n_tiles = ReadBankedUBYTE(&(tileset->n_tiles), bank);
    if (n_tiles) SetBankedSpriteData(base_tile, n_tiles, tileset->tiles, bank);
    return n_tiles;
}

UBYTE load_sprite(UBYTE sprite_offset, const spritesheet_t * sprite, UBYTE bank) BANKED {
    far_ptr_t data;
    ReadBankedFarPtr(&data, (void *)&sprite->tileset, bank);
    UBYTE n_tiles = load_sprite_tileset(sprite_offset, data.ptr, data.bank);
#ifdef CGB
    if (_is_CGB) {
        ReadBankedFarPtr(&data, (void *)&sprite->cgb_tileset, bank);
        if (data.ptr) {
            VBK_REG = 1;
            UBYTE n_cgb_tiles = load_sprite_tileset(sprite_offset, data.ptr, data.bank);
            VBK_REG = 0;
            if (n_cgb_tiles > n_tiles) return n_cgb_tiles;
        }
    }
#endif
    return n_tiles;
}

void load_animations(const spritesheet_t *sprite, UBYTE bank, UWORD animation_set, animation_t * res_animations) NONBANKED {
    UBYTE _save = _current_bank;
    SWITCH_ROM(bank);
    memcpy(res_animations, sprite->animations + sprite->animations_lookup[animation_set], sizeof(animation_t) * 8);
    SWITCH_ROM(_save);
}

void load_bounds(const spritesheet_t *sprite, UBYTE bank, bounding_box_t * res_bounds) BANKED {
    MemcpyBanked(res_bounds, &sprite->bounds, sizeof(sprite->bounds), bank);
}

UBYTE do_load_palette(palette_entry_t * dest, const palette_t * palette, UBYTE bank) BANKED {
    UBYTE mask = ReadBankedUBYTE(&palette->mask, bank);
    palette_entry_t * sour = palette->cgb_palette;
    for (UBYTE i = mask; (i); i >>= 1, dest++) {
        if ((i & 1) == 0) continue;
        MemcpyBanked(dest, sour, sizeof(palette_entry_t), bank);
        sour++;
    }
    return mask;
}

inline void load_bkg_palette(const palette_t * palette, UBYTE bank) {
    UBYTE mask = do_load_palette(BkgPalette, palette, bank);
    DMG_palette[0] = ReadBankedUBYTE(palette->palette, bank);
#ifdef SGB
    if (_is_SGB) {
        UBYTE sgb_palettes = SGB_PALETTES_NONE;
        if (mask & 0b00110000) sgb_palettes |= SGB_PALETTES_01;
        if (mask & 0b11000000) sgb_palettes |= SGB_PALETTES_23;
        SGBTransferPalettes(sgb_palettes);
    }
#endif
}

inline void load_sprite_palette(const palette_t * palette, UBYTE bank) {
    do_load_palette(SprPalette, palette, bank);
    UWORD data = ReadBankedUWORD(palette->palette, bank);
    DMG_palette[1] = (UBYTE)data;
    DMG_palette[2] = (UBYTE)(data >> 8);
}

UBYTE load_scene(const scene_t * scene, UBYTE bank, UBYTE init_data) BANKED {
    UBYTE i, tile_allocation_hiwater;
    scene_t scn;

    MemcpyBanked(&scn, scene, sizeof(scn), bank);

    current_scene.bank  = bank;
    current_scene.ptr   = (void *)scene;

    // Load scene
    scene_type      = scn.type;
    actors_len      = MIN(scn.n_actors + 1,     MAX_ACTORS);
    triggers_len    = MIN(scn.n_triggers,       MAX_TRIGGERS);
    projectiles_len = MIN(scn.n_projectiles,    MAX_PROJECTILE_DEFS);
    sprites_len     = MIN(scn.n_sprites,        MAX_SCENE_SPRITES);

    collision_bank  = scn.collisions.bank;
    collision_ptr   = scn.collisions.ptr;

    // Load UI tiles, they may be overwritten by the following load_background()
    ui_load_tiles();

    // Load background + tiles
    load_background(scn.background.ptr, scn.background.bank);

    load_bkg_palette(scn.palette.ptr, scn.palette.bank);
    load_sprite_palette(scn.sprite_palette.ptr, scn.sprite_palette.bank);

    // Copy parallax settings
    memcpy(&parallax_rows, &scn.parallax_rows, sizeof(parallax_rows));
    if (scn.parallax_rows[0].next_y == 0) {
        scene_LCD_type = (scene_type == SCENE_TYPE_LOGO) ? LCD_fullscreen : LCD_simple;
    } else {
        scene_LCD_type = LCD_parallax;
    }

    projectiles_init();

    if (scene_type != SCENE_TYPE_LOGO) {
        // Load player
        PLAYER.sprite = scn.player_sprite;
        UBYTE n_loaded = load_sprite(PLAYER.base_tile = 0, scn.player_sprite.ptr, scn.player_sprite.bank);
        tile_allocation_hiwater = (n_loaded > scn.reserve_tiles) ? n_loaded : scn.reserve_tiles;
        load_animations(scn.player_sprite.ptr, scn.player_sprite.bank, ANIM_SET_DEFAULT, PLAYER.animations);
        load_bounds(scn.player_sprite.ptr, scn.player_sprite.bank, &PLAYER.bounds);
    } else {
        // no player on logo, but still some little amount of actors may be present
        PLAYER.base_tile = tile_allocation_hiwater = 0x68;
        PLAYER.sprite = spritesheet_none_far;
        memset(PLAYER.animations, 0, sizeof(PLAYER.animations));
    }

    // Load sprites
    if (sprites_len != 0) {
        far_ptr_t * scene_sprite_ptrs = scn.sprites.ptr;
        far_ptr_t tmp_ptr;
        for (i = 0; i != sprites_len; i++) {
            if (i == MAX_SCENE_SPRITES) break;
            ReadBankedFarPtr(&tmp_ptr, (UBYTE *)scene_sprite_ptrs, scn.sprites.bank);
            scene_sprites_base_tiles[i] = tile_allocation_hiwater;
            tile_allocation_hiwater += load_sprite(tile_allocation_hiwater, tmp_ptr.ptr, tmp_ptr.bank);
            scene_sprite_ptrs++;
        }
    }

    if (init_data) {
        camera_reset();

        // Copy scene player hit scripts to player actor
        memcpy(&PLAYER.script, &scn.script_p_hit1, sizeof(far_ptr_t));

        player_moving = FALSE;

        // Load actors
        actors_active_head = NULL;
        actors_inactive_head = NULL;

        // Add player to inactive, then activate
        PLAYER.active = FALSE;
        actors_active_tail = &PLAYER;
        DL_PUSH_HEAD(actors_inactive_head, actors_active_tail);
        activate_actor(&PLAYER);

        // Add other actors, activate pinned
        if (actors_len != 0) {
            actor_t * actor = actors + 1;
            MemcpyBanked(actor, scn.actors.ptr, sizeof(actor_t) * (actors_len - 1), scn.actors.bank);
            for (i = actors_len - 1; i != 0; i--, actor++) {
                if (actor->reserve_tiles) {
                    // exclusive sprites allocated separately to avoid overwriting if modified
                    actor->base_tile = tile_allocation_hiwater;
                    UBYTE n_loaded = load_sprite(tile_allocation_hiwater, actor->sprite.ptr, actor->sprite.bank);
                    tile_allocation_hiwater += (n_loaded > actor->reserve_tiles) ? n_loaded : actor->reserve_tiles;
                } else {
                    // resolve and set base_tile for each actor
                    UBYTE idx = IndexOfFarPtr(scn.sprites.ptr, scn.sprites.bank, sprites_len, &actor->sprite);
                    actor->base_tile = (idx < sprites_len) ? scene_sprites_base_tiles[idx] : 0;
                }
                load_animations((void *)actor->sprite.ptr, actor->sprite.bank, ANIM_SET_DEFAULT, actor->animations);
                // add to inactive list by default
                actor->active = FALSE;
                DL_PUSH_HEAD(actors_inactive_head, actor);

                // activate if the actor is pinned or persistent
                if ((actor->pinned) || (actor->persistent)) activate_actor(actor);
            }
        }

        // Load projectiles
        if (projectiles_len  != 0) {
            projectile_def_t * projectile_def = projectile_defs;
            MemcpyBanked(projectile_def, scn.projectiles.ptr, sizeof(projectile_def_t) * projectiles_len, scn.projectiles.bank);
            for (i = projectiles_len; i != 0; i--, projectile_def++) {
                // resolve and set base_tile for each projectile
                UBYTE idx = IndexOfFarPtr(scn.sprites.ptr, scn.sprites.bank, sprites_len, &projectile_def->sprite);
                projectile_def->base_tile = (idx < sprites_len) ? scene_sprites_base_tiles[idx] : 0;
            }
        }

    } else {
        actor_t *actor = actors_active_head;
        while (actor) {
            actor_set_anim_idle(actor);
            actor = actor->next;
        }
    }

    // Load triggers
    if (triggers_len != 0) {
        MemcpyBanked(&triggers, scn.triggers.ptr, sizeof(trigger_t) * triggers_len, scn.triggers.bank);
    }

    scroll_reset();
    trigger_reset();

    emote_actor = NULL;

    if ((init_data) && (scn.script_init.ptr != NULL)) {
        return (script_execute(scn.script_init.bank, scn.script_init.ptr, 0, 0) != 0);
    }
    return FALSE;
}

void load_player() BANKED {
    PLAYER.pos.x = start_scene_x;
    PLAYER.pos.y = start_scene_y;
    PLAYER.dir = start_scene_dir;
    PLAYER.move_speed = start_player_move_speed;
    PLAYER.anim_tick = start_player_anim_tick;
    PLAYER.frame = 0;
    PLAYER.frame_start = 0;
    PLAYER.frame_end = 2;
    PLAYER.pinned = FALSE;
    PLAYER.collision_group = COLLISION_GROUP_PLAYER;
    PLAYER.collision_enabled = TRUE;
}

void load_emote(const unsigned char *tiles, UBYTE bank) BANKED {
    SetBankedSpriteData(EMOTE_SPRITE, EMOTE_SPRITE_SIZE, tiles + 0, bank);
}
