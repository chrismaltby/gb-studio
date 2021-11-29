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

// here we define all VM instructions: their handlers and parameter lengths in bytes
// this array must be nonbanked as well as STEP_VM()
const SCRIPT_CMD script_cmds[] = {
    // system instructions section
    {vm_push,                   2}, // 0x01
    {vm_pop,                    1}, // 0x02
    {vm_call_rel,               1}, // 0x03
    {vm_call,                   2}, // 0x04
    {vm_ret,                    1}, // 0x05
    {vm_loop_rel,               4}, // 0x06
    {vm_loop,                   5}, // 0x07
    {vm_jump_rel,               1}, // 0x08
    {vm_jump,                   2}, // 0x09
    {vm_call_far,               3}, // 0x0A
    {vm_ret_far,                1}, // 0x0B
    {vm_systime,                2}, // 0x0C
    {vm_invoke,                 6}, // 0x0D
    {vm_beginthread,            6}, // 0x0E
    {vm_if,                     8}, // 0x0F
    {vm_push_value_ind,         2}, // 0x11 
    {vm_push_value,             2}, // 0x11
    {vm_reserve,                1}, // 0x12
    {vm_set,                    4}, // 0x13
    {vm_set_const,              4}, // 0x14
    {vm_rpn,                    0}, // 0x15
    {vm_join,                   2}, // 0x16
    {vm_terminate,              2}, // 0x17
    {vm_idle,                   0}, // 0x18
    {vm_get_tlocal,             4}, // 0x19
    {vm_if_const,               8}, // 0x1A
    {vm_get_uint8,              4}, // 0x1B
    {vm_get_int8,               4}, // 0x1C
    {vm_get_int16,              4}, // 0x1D
    {vm_set_uint8,              4}, // 0x1E
    {vm_set_int8,               4}, // 0x1F
    {vm_set_int16,              4}, // 0x20
    {vm_set_const_int8,         3}, // 0x21
    {vm_set_const_int16,        4}, // 0x22
    {vm_randomize,              0}, // 0x23
    {vm_rand,                   8}, // 0x24
    {vm_lock,                   0}, // 0x25
    {vm_unlock,                 0}, // 0x26
    {vm_raise,                  2}, // 0x27
    {vm_set_indirect,           4}, // 0x28
    {vm_get_indirect,           4}, // 0x29
    {vm_test_terminate,         1}, // 0x2A
    {vm_poll_loaded,            2}, // 0x2B
    {vm_push_reference,         2}, // 0x2C 
    {vm_call_native,            3}, // 0x2D
    // load/save instrunctions section
    {vm_save_peek,              8}, // 0x2E
    {vm_save_clear,             1}, // 0x2F

    // actor instructions section
    {vm_actor_move_to,          2}, // 0x30
    {vm_actor_activate,         2}, // 0x31
    {vm_actor_set_dir,          3}, // 0x32
    {vm_actor_deactivate,       2}, // 0x33
    {vm_actor_set_anim,         4}, // 0x34
    {vm_actor_set_pos,          2}, // 0x35
    {vm_actor_emote,            5}, // 0x36
    {vm_actor_set_bounds,       6}, // 0x37
    {vm_actor_set_spritesheet,  5}, // 0x38
    {vm_actor_replace_tile,     8}, // 0x39
    {vm_actor_get_pos,          2}, // 0x3A
    {vm_actor_set_hidden,       3}, // 0x3B
    {vm_actor_get_dir,          4}, // 0x3C
    {vm_actor_set_anim_tick,    3}, // 0x3D
    {vm_actor_set_move_speed,   3}, // 0x3E
    {vm_actor_set_coll_enabled, 3}, // 0x3F

    // user interface instructions section
    {vm_load_text,              1}, // 0x40
    {vm_display_text,           0}, // 0x41
    {vm_overlay_setpos,         2}, // 0x42
    {vm_overlay_hide,           0}, // 0x43
    {vm_overlay_wait,           2}, // 0x44
    {vm_overlay_move_to,        3}, // 0x45
    {vm_overlay_show,           4}, // 0x46
    {vm_overlay_clear,          6}, // 0x47
    {vm_choice,                 4}, // 0x48
    {vm_load_frame,             3}, // 0x49
    {vm_load_cursor,            3}, // 0x4A
    {vm_set_font,               1}, // 0x4B
    {vm_set_print_dir,          1}, // 0x4C
    {vm_overlay_scroll,         5}, // 0x4D
    {vm_overlay_set_scroll,     5}, // 0x4E
    {vm_overlay_set_submap,     6}, // 0x4F

    // gameboy features instructions section
    {vm_show_sprites,           0}, // 0x50
    {vm_hide_sprites,           0}, // 0x51
    {vm_input_wait,             1}, // 0x52
    {vm_input_attach,           2}, // 0x53
    {vm_input_get,              3}, // 0x54
    {vm_context_prepare,        4}, // 0x55
    {vm_fade_in,                1}, // 0x56
    {vm_fade_out,               1}, // 0x57
    {vm_timer_prepare,          4}, // 0x58
    {vm_timer_set,              2}, // 0x59
    {vm_get_tile_xy,            6}, // 0x5A
    {vm_replace_tile,           8}, // 0x5B
    {vm_poll,                   5}, // 0x5C
    {vm_set_sprite_mode,        1}, // 0x5D
    {vm_replace_tile_xy,        7}, // 0x5E
    {vm_input_detach,           1}, // 0x5F

    // music and sound instructions section
    {vm_music_play,             4}, // 0x60
    {vm_music_stop,             0}, // 0x61
    {vm_music_mute,             1}, // 0x62
    {vm_sound_mastervol,        1}, // 0x63
    {vm_sound_play,             2}, // 0x64
    {vm_music_routine,          4}, // 0x65
    {vm_wave_play,              6}, // 0x66
    {vm_music_setpos,           2}, // 0x67
    {vm_scene_push,             0}, // 0x68
    {vm_scene_pop,              0}, // 0x69
    {vm_scene_pop_all,          0}, // 0x6A
    {vm_scene_stack_reset,      0}, // 0x6B

    // SIO transfers
    {vm_sio_set_mode,           1}, // 0x6C
    {vm_sio_exchange,           5}, // 0x6D
    {0, 0},
    {0, 0},

    // camera instructions section
    {vm_camera_move_to,         4}, // 0x70
    {vm_camera_set_pos,         2}, // 0x71
    {vm_timer_stop,             1}, // 0x72
    {vm_timer_reset,            1}, // 0x73
    {vm_actor_terminate_update, 2}, // 0x74
    {vm_actor_set_anim_frame,   2}, // 0x75
    // variable manipulation
    {vm_memset,                 6}, // 0x76
    {vm_memcpy,                 6}, // 0x77
    // RTC instructions section
    {vm_rtc_latch,              0}, // 0x78
    {vm_rtc_get,                3}, // 0x79
    {vm_rtc_set,                3}, // 0x7A
    {vm_rtc_start,              1}, // 0x7B
    // color instrunctions section
    {vm_load_palette,           2}, // 0x7C
    {0, 0},
    // SGB instructions section
    {vm_sgb_transfer,           0}, // 0x7E
    // RUMBLE
    {vm_rumble,                 1}, // 0x7F

    // projectiles instructions section
    {vm_projectile_launch,      3}, // 0x80
    {0, 0},
    {0, 0},

    {vm_actor_get_anim_frame,   2}, // 0x83
    {vm_actor_set_anim_set,     4}, // 0x84
    {vm_switch_text_layer,      1}, // 0x85 
    {vm_actor_get_angle,        4}, // 0x86
    {vm_actor_set_spritesheet_by_ref, 4}, // 0x87
    {0, 0},

    // trigonometry instructions section
    {vm_sin_scale,              5}, // 0x89 
    {vm_cos_scale,              5}  // 0x8A
};
