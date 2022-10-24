#include "vm.h"

#include "vm_actor.h"
#include "vm_ui.h"
#include "vm_gameboy.h"
#include "vm_music.h"
#include "vm_camera.h"
#include "vm_math.h"
#include "vm_rtc.h"
#include "vm_projectiles.h"
#include "vm_scene.h"
#include "vm_palette.h"
#include "vm_sgb.h"
#include "vm_sio.h"
#include "vm_load_save.h"
#include "vm_gbprinter.h"

// here we define all VM instructions: their handlers and parameter lengths in bytes
// this array must be nonbanked as well as STEP_VM()
const SCRIPT_CMD script_cmds[] = {
    // system instructions section
    {vm_push,                           BANK(VM_MAIN),          2}, // 0x01
    {vm_pop,                            BANK(VM_MAIN),          1}, // 0x02
    {0, 0, 0},
    {vm_call,                           BANK(VM_MAIN),          2}, // 0x04
    {vm_ret,                            BANK(VM_MAIN),          1}, // 0x05
    {vm_get_far,                        BANK(VM_MAIN),          6}, // 0x06
    {vm_loop,                           BANK(VM_MAIN),          5}, // 0x07
    {vm_switch,                         BANK(VM_MAIN),          4}, // 0x08
    {vm_jump,                           BANK(VM_MAIN),          2}, // 0x09
    {vm_call_far,                       BANK(VM_MAIN),          3}, // 0x0A
    {vm_ret_far,                        BANK(VM_MAIN),          1}, // 0x0B
    {0, 0, 0},
    {vm_invoke,                         BANK(VM_MAIN),          6}, // 0x0D
    {vm_beginthread,                    BANK(VM_MAIN),          6}, // 0x0E
    {vm_if,                             BANK(VM_MAIN),          8}, // 0x0F
    {vm_push_value_ind,                 BANK(VM_MAIN),          2}, // 0x11
    {vm_push_value,                     BANK(VM_MAIN),          2}, // 0x11
    {vm_reserve,                        BANK(VM_MAIN),          1}, // 0x12
    {vm_set,                            BANK(VM_MAIN),          4}, // 0x13
    {vm_set_const,                      BANK(VM_MAIN),          4}, // 0x14
    {vm_rpn,                            BANK(VM_MAIN),          0}, // 0x15
    {vm_join,                           BANK(VM_MAIN),          2}, // 0x16
    {vm_terminate,                      BANK(VM_MAIN),          2}, // 0x17
    {vm_idle,                           BANK(VM_MAIN),          0}, // 0x18
    {vm_get_tlocal,                     BANK(VM_MAIN),          4}, // 0x19
    {vm_if_const,                       BANK(VM_MAIN),          8}, // 0x1A
    {vm_get_uint8,                      BANK(VM_MAIN),          4}, // 0x1B
    {vm_get_int8,                       BANK(VM_MAIN),          4}, // 0x1C
    {vm_get_int16,                      BANK(VM_MAIN),          4}, // 0x1D
    {vm_set_uint8,                      BANK(VM_MAIN),          4}, // 0x1E
    {vm_set_int8,                       BANK(VM_MAIN),          4}, // 0x1F
    {vm_set_int16,                      BANK(VM_MAIN),          4}, // 0x20
    {vm_set_const_int8,                 BANK(VM_MAIN),          3}, // 0x21
    {vm_set_const_int16,                BANK(VM_MAIN),          4}, // 0x22
    {vm_init_rng,                       BANK(VM_MAIN),          2}, // 0x23
    {vm_rand,                           BANK(VM_MAIN),          8}, // 0x24
    {vm_lock,                           BANK(VM_MAIN),          0}, // 0x25
    {vm_unlock,                         BANK(VM_MAIN),          0}, // 0x26
    {vm_raise,                          BANK(VM_MAIN),          2}, // 0x27
    {vm_set_indirect,                   BANK(VM_MAIN),          4}, // 0x28
    {vm_get_indirect,                   BANK(VM_MAIN),          4}, // 0x29
    {vm_test_terminate,                 BANK(VM_MAIN),          1}, // 0x2A
    {vm_poll_loaded,                    BANK(VM_MAIN),          2}, // 0x2B
    {vm_push_reference,                 BANK(VM_MAIN),          2}, // 0x2C
    {vm_call_native,                    BANK(VM_MAIN),          3}, // 0x2D
    // load/save instrunctions section
    {vm_save_peek,                      BANK(VM_LOAD_SAVE),     9}, // 0x2E
    {vm_save_clear,                     BANK(VM_LOAD_SAVE),     1}, // 0x2F

    // actor instructions section
    {vm_actor_move_to,                  BANK(VM_ACTOR),         2}, // 0x30
    {vm_actor_activate,                 BANK(VM_ACTOR),         2}, // 0x31
    {vm_actor_set_dir,                  BANK(VM_ACTOR),         3}, // 0x32
    {vm_actor_deactivate,               BANK(VM_ACTOR),         2}, // 0x33
    {vm_actor_set_anim,                 BANK(VM_ACTOR),         4}, // 0x34
    {vm_actor_set_pos,                  BANK(VM_ACTOR),         2}, // 0x35
    {vm_actor_emote,                    BANK(VM_ACTOR),         5}, // 0x36
    {vm_actor_set_bounds,               BANK(VM_ACTOR),         6}, // 0x37
    {vm_actor_set_spritesheet,          BANK(VM_ACTOR),         5}, // 0x38
    {vm_actor_replace_tile,             BANK(VM_ACTOR),         8}, // 0x39
    {vm_actor_get_pos,                  BANK(VM_ACTOR),         2}, // 0x3A
    {0, 0, 0},
    {vm_actor_get_dir,                  BANK(VM_ACTOR),         4}, // 0x3C
    {vm_actor_set_anim_tick,            BANK(VM_ACTOR),         3}, // 0x3D
    {vm_actor_set_move_speed,           BANK(VM_ACTOR),         3}, // 0x3E
    {vm_actor_set_flags,                BANK(VM_ACTOR),         4}, // 0x3F

    // user interface instructions section
    {vm_load_text,                      BANK(VM_UI),            1}, // 0x40
    {vm_display_text,                   BANK(VM_UI),            2}, // 0x41
    {vm_overlay_setpos,                 BANK(VM_UI),            2}, // 0x42
    {0, 0, 0},
    {vm_overlay_wait,                   BANK(VM_UI),            2}, // 0x44
    {vm_overlay_move_to,                BANK(VM_UI),            3}, // 0x45
    {vm_overlay_show,                   BANK(VM_UI),            4}, // 0x46
    {vm_overlay_clear,                  BANK(VM_UI),            6}, // 0x47
    {vm_choice,                         BANK(VM_UI),            4}, // 0x48
    {vm_load_tiles,                     BANK(VM_GAMEBOY),       5}, // 0x49
    {0, 0, 0},
    {vm_set_font,                       BANK(VM_UI),            1}, // 0x4B
    {vm_overlay_set_submap_ex,          BANK(VM_UI),            2}, // 0x4C
    {vm_overlay_scroll,                 BANK(VM_UI),            5}, // 0x4D
    {vm_overlay_set_scroll,             BANK(VM_UI),            5}, // 0x4E
    {vm_overlay_set_submap,             BANK(VM_UI),            6}, // 0x4F

    // gameboy features instructions section
    {vm_load_tileset,                   BANK(VM_GAMEBOY),       5}, // 0x50
    {vm_set_sprites_visible,            BANK(VM_GAMEBOY),       1}, // 0x51
    {vm_input_wait,                     BANK(VM_GAMEBOY),       1}, // 0x52
    {vm_input_attach,                   BANK(VM_GAMEBOY),       2}, // 0x53
    {vm_input_get,                      BANK(VM_GAMEBOY),       3}, // 0x54
    {vm_context_prepare,                BANK(VM_GAMEBOY),       4}, // 0x55
    {vm_overlay_set_map,                BANK(VM_UI),            9}, // 0x56
    {vm_fade,                           BANK(VM_GAMEBOY),       1}, // 0x57
    {vm_timer_prepare,                  BANK(VM_GAMEBOY),       4}, // 0x58
    {vm_timer_set,                      BANK(VM_GAMEBOY),       2}, // 0x59
    {vm_get_tile_xy,                    BANK(VM_GAMEBOY),       6}, // 0x5A
    {vm_replace_tile,                   BANK(VM_GAMEBOY),       8}, // 0x5B
    {vm_poll,                           BANK(VM_GAMEBOY),       5}, // 0x5C
    {vm_set_sprite_mode,                BANK(VM_GAMEBOY),       1}, // 0x5D
    {vm_replace_tile_xy,                BANK(VM_GAMEBOY),       7}, // 0x5E
    {vm_input_detach,                   BANK(VM_GAMEBOY),       1}, // 0x5F

    // music and sound instructions section
    {vm_music_play,                     BANK(VM_MUSIC),         4}, // 0x60
    {vm_music_stop,                     BANK(VM_MUSIC),         0}, // 0x61
    {vm_music_mute,                     BANK(VM_MUSIC),         1}, // 0x62
    {vm_sound_mastervol,                BANK(VM_MUSIC),         1}, // 0x63
    {0, 0, 0},
    {vm_music_routine,                  BANK(VM_MUSIC),         4}, // 0x65
    {vm_sfx_play,                       BANK(VM_MUSIC),         5}, // 0x66
    {vm_music_setpos,                   BANK(VM_MUSIC),         2}, // 0x67
    // scene stack instructions
    {vm_scene_push,                     BANK(VM_SCENE),         0}, // 0x68
    {vm_scene_pop,                      BANK(VM_SCENE),         0}, // 0x69
    {vm_scene_pop_all,                  BANK(VM_SCENE),         0}, // 0x6A
    {vm_scene_stack_reset,              BANK(VM_SCENE),         0}, // 0x6B

    // SIO transfers
    {vm_sio_set_mode,                   BANK(VM_SIO),           1}, // 0x6C
    {vm_sio_exchange,                   BANK(VM_SIO),           5}, // 0x6D
    {0, 0, 0},
    {0, 0, 0},

    // camera instructions section
    {vm_camera_move_to,                 BANK(VM_CAMERA),        4}, // 0x70
    {vm_camera_set_pos,                 BANK(VM_CAMERA),        2}, // 0x71
    {vm_timer_stop,                     BANK(VM_GAMEBOY),       1}, // 0x72
    {vm_timer_reset,                    BANK(VM_GAMEBOY),       1}, // 0x73
    {vm_actor_terminate_update,         BANK(VM_ACTOR),         2}, // 0x74
    {vm_actor_set_anim_frame,           BANK(VM_ACTOR),         2}, // 0x75
    // variable manipulation
    {vm_memset,                         BANK(VM_MAIN),          6}, // 0x76
    {vm_memcpy,                         BANK(VM_MAIN),          6}, // 0x77
    // RTC instructions section
    {vm_rtc_latch,                      BANK(VM_RTC),           0}, // 0x78
    {vm_rtc_get,                        BANK(VM_RTC),           3}, // 0x79
    {vm_rtc_set,                        BANK(VM_RTC),           3}, // 0x7A
    {vm_rtc_start,                      BANK(VM_RTC),           1}, // 0x7B
    // color instrunctions section
    {vm_load_palette,                   BANK(VM_PALETTE),       2}, // 0x7C
    {0, 0, 0},
    // SGB instructions section
    {vm_sgb_transfer,                   BANK(VM_SGB),           0}, // 0x7E
    // RUMBLE
    {vm_rumble,                         BANK(VM_GAMEBOY),       1}, // 0x7F

    // projectiles instructions section
    {vm_projectile_launch,              BANK(VM_PROJECTILE),    3}, // 0x80
    {vm_projectile_load_type,           BANK(VM_PROJECTILE),    4}, // 0x81
    {0, 0, 0},

    {vm_actor_get_anim_frame,           BANK(VM_ACTOR),         2}, // 0x83
    {vm_actor_set_anim_set,             BANK(VM_ACTOR),         4}, // 0x84
    {vm_switch_text_layer,              BANK(VM_UI),            1}, // 0x85
    {vm_actor_get_angle,                BANK(VM_ACTOR),         4}, // 0x86
    {vm_actor_set_spritesheet_by_ref,   BANK(VM_ACTOR),         4}, // 0x87
    {vm_actor_move_cancel,              BANK(VM_ACTOR),         2}, //0x88

    // trigonometry instructions section
    {vm_sin_scale,                      BANK(VM_MATH),          5}, // 0x89
    {vm_cos_scale,                      BANK(VM_MATH),          5}, // 0x8A

    {vm_set_text_sound,                 BANK(VM_UI),            4}, // 0x8B

    // GBPrinter functions
    {vm_print_detect,                   BANK(VM_GBPRINTER),     3}, // 0x8C
    {vm_print_overlay,                  BANK(VM_GBPRINTER),     5}  // 0x8D
};
