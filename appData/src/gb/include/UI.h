#ifndef UI_H
#define UI_H

#include <gb/gb.h>

#define UI_BANK 3
#define MENU_OPEN_Y 112
#define WIN_LEFT_X 7
#define MENU_CLOSED_Y (MAXWNDPOSY + 1U)
#define TEXT_BUFFER_START 0xCCU
#define MENU_LAYOUT_INITIAL_X 88
#define MENU_CANCEL_ON_LAST_OPTION 0x01U
#define MENU_CANCEL_ON_B_PRESSED 0x02U

extern UBYTE ui_block;
extern unsigned char text_lines[80];
extern unsigned char tmp_text_lines[80];
extern UBYTE win_pos_x;
extern UBYTE win_pos_y;
extern UBYTE win_dest_pos_x;
extern UBYTE win_dest_pos_y;
extern UBYTE win_speed;
extern UBYTE text_in_speed;
extern UBYTE text_out_speed;
// Instant = 0, Every frame = 0x0, IS_FRAME_2 = 0x1 (default)
// IS_FRAME_4 = 0x3, IS_FRAME_8 = 0x7, IS_FRAME_16 = 15u
extern UBYTE text_draw_speed;
extern UBYTE text_ff_joypad;
extern UBYTE tmp_text_in_speed;
extern UBYTE tmp_text_out_speed;
extern UBYTE menu_layout;
extern UBYTE text_num_lines;
extern UBYTE text_x;
extern UBYTE text_y;
extern UBYTE text_drawn;
extern UBYTE text_count;
extern UBYTE text_tile_count;
extern UBYTE text_wait;
extern UBYTE avatar_enabled;
extern UBYTE menu_enabled;
extern UBYTE menu_cancel_on_last_option;
extern BYTE menu_index;
extern UBYTE menu_num_options;
extern UWORD menu_flag;
extern UBYTE menu_cancel_on_b;

void UIInit();
void UIUpdate();
void UIInteract_Update();
void UIReset();
void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height);
void UIDrawDialogueFrame(UBYTE h);
void UIShowText(UBYTE bank, UWORD bank_offset);
void UIShowChoice(UWORD flag_index, UBYTE bank, UWORD bank_offset);
void UISetPos(UBYTE x, UBYTE y);
void UIMoveTo(UBYTE x, UBYTE y, UBYTE speed);
UBYTE UIIsClosed();
void UIOnInteract();
UBYTE UIAtDest();
void UISetColor(UBYTE color);
void UISetTextSpeed(UBYTE in, UBYTE out);
void UIShowAvatar(UBYTE avatar_index);
void UIShowMenu(UWORD flag_index, UBYTE bank, UWORD bank_offset, UBYTE layout, UBYTE cancel_config);
void UIDrawMenuCursor();

/**
 * Determine if UI is in state that should prevent input and background scripts from being handled
 *
 * @return boolean true if UI should be blocking
 */
UBYTE UIIsBlocking();

#endif
