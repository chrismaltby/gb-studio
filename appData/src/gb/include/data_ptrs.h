#ifndef DATA_PTRS_H
#define DATA_PTRS_H


typedef struct _BANK_PTR {
  unsigned char bank;
  unsigned int offset;
} BANK_PTR;

#define DATA_PTRS_BANK 5
#define START_SCENE_INDEX 0x0004
#define START_SCENE_X 0x00
#define START_SCENE_Y 0x11
#define START_SCENE_DIR_X 1
#define START_SCENE_DIR_Y 0
#define START_PLAYER_SPRITE 8
#define START_PLAYER_MOVE_SPEED 1
#define START_PLAYER_ANIM_SPEED 3
#define FONT_BANK 6
#define FONT_BANK_OFFSET 9461
#define FRAME_BANK 6
#define FRAME_BANK_OFFSET 13045
#define CURSOR_BANK 6
#define CURSOR_BANK_OFFSET 13189
#define EMOTES_SPRITE_BANK 6
#define EMOTES_SPRITE_BANK_OFFSET 13205
#define NUM_VARIABLES 9

extern const BANK_PTR tileset_bank_ptrs[];
extern const BANK_PTR background_bank_ptrs[];
extern const BANK_PTR palette_bank_ptrs[];
extern const BANK_PTR background_attr_bank_ptrs[];
extern const BANK_PTR sprite_bank_ptrs[];
extern const BANK_PTR scene_bank_ptrs[];
extern const BANK_PTR collision_bank_ptrs[];
extern const BANK_PTR string_bank_ptrs[];
extern const BANK_PTR avatar_bank_ptrs[];
extern const unsigned char (*bank_data_ptrs[])[];
extern const unsigned char * music_tracks[];
extern const unsigned char music_banks[];
extern unsigned char script_variables[10];

#endif
