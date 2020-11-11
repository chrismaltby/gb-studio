#ifndef DATA_PTRS_H
#define DATA_PTRS_H

#include "BankData.h"
#define DATA_PTRS_BANK 5
#define FONT_BANK 6
#define FONT_BANK_OFFSET 0
#define FRAME_BANK 6
#define FRAME_BANK_OFFSET 3584
#define CURSOR_BANK 6
#define CURSOR_BANK_OFFSET 3728
#define EMOTES_SPRITE_BANK 6
#define EMOTES_SPRITE_BANK_OFFSET 3744
#define NUM_VARIABLES 500
#define TMP_VAR_1 100
#define TMP_VAR_2 101

extern const BankPtr tileset_bank_ptrs[];
extern const BankPtr background_bank_ptrs[];
extern const BankPtr background_attr_bank_ptrs[];
extern const BankPtr palette_bank_ptrs[];
extern const BankPtr sprite_bank_ptrs[];
extern const BankPtr scene_bank_ptrs[];
extern const BankPtr collision_bank_ptrs[];
extern const BankPtr avatar_bank_ptrs[];
extern const unsigned int bank_data_ptrs[];
extern const unsigned int music_tracks[];
extern const unsigned char music_banks[];
extern unsigned int start_scene_index;
extern int start_scene_x;
extern int start_scene_y;
extern char start_scene_dir_x;
extern char start_scene_dir_y;
extern unsigned int start_player_sprite;
extern unsigned char start_player_move_speed;
extern unsigned char start_player_anim_speed;
extern unsigned char start_fade_style;
extern unsigned char script_variables[500];
extern const unsigned int music_track_101__Data[];
extern const unsigned int music_track_102__Data[];
extern const unsigned int music_track_103__Data[];
extern const unsigned int music_track_104__Data[];
extern const unsigned int music_track_105__Data[];
extern const unsigned int music_track_106__Data[];
extern const unsigned int music_track_107__Data[];
extern const unsigned int music_track_108__Data[];
extern const unsigned int music_track_109__Data[];

#endif
