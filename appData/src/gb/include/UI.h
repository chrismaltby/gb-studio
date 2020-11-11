#ifndef UI_H
#define UI_H

#include <gb/gb.h>

#define UI_BANK 1
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

/**
 * Initialise UI
 */
void UIInit();

/**
 * Update UI
 */
void UIUpdate();

/**
 * Same as UIUpdate() but requires manually switching to bank 1 first
 */
void UIUpdate_b() __banked;

/**
 * Handle joypad input for UI
 */
void UIOnInteract();

/**
 * Same as UIOnInteract() but requires manually switching to bank 1 first
 */
void UIOnInteract_b() __banked;

/**
 * Reset UI ready for new scene start
 */
void UIReset();

/**
 * Set position of UI layer
 * 
 * @param x X position
 * @param y Y position
 */
void UISetPos(UBYTE x, UBYTE y);

/**
 * Animate position of UI layer towards new destination
 * 
 * @param x Destination X position
 * @param y Destination Y position
 * @param speed UI movement speed
 */
void UIMoveTo(UBYTE x, UBYTE y, UBYTE speed);

/**
 * Draw a frame at position {x,y} with the specified width and height
 * 
 * @param x X position
 * @param y Y position
 * @param width Frame width
 * @param height Frame height 
 */
void UIDrawFrame(UBYTE x, UBYTE y, UBYTE width, UBYTE height);

/**
 * Draw a dialogue frame at position {0,0} with enough room for specified lines of text
 * 
 * @param h Number of lines of text to allow within frame
 */
void UIDrawDialogueFrame(UBYTE h);

/**
 * Set UI Overlay to a solid color
 * 
 * @param color 0 for black, 1 for white
 */
void UISetColor(UBYTE color);

/**
 * Draw avatar in dialogue box
 * 
 * @param avatar_index avatar index in data_ptrs.h
 */
void UIShowAvatar(UBYTE avatar_index);

/**
 * Set text in dialogue box
 * 
 * @param bank bank location of string
 * @param bank_offset memory offset of string within bank
 */
void UIShowText(UBYTE bank, UWORD bank_offset);

/**
 * Set multiple choice text in dialogue box
 * 
 * @param flag_index index of script_variable to store selected choice
 * @param bank bank location of string
 * @param bank_offset memory offset of string within bank
 */
void UIShowChoice(UWORD flag_index, UBYTE bank, UWORD bank_offset);

/**
 * Set menu text in dialogue box
 * 
 * @param flag_index index of script_variable to store selected choice
 * @param bank bank location of string
 * @param bank_offset memory offset of string within bank
 * @param layout if TRUE set menu to single column on right of screen
 * @param cancel_config bit flag for cancel handling configuration
 */
void UIShowMenu(UWORD flag_index, UBYTE bank, UWORD bank_offset, UBYTE layout, UBYTE cancel_config);

/**
 * Check if UI is currently closed
 * 
 * @return TRUE if UI is closed
 */
UBYTE UIIsClosed();

/**
 * Check if UI is at current destination
 * 
 * @return TRUE if UI is at destination
 */
UBYTE UIAtDest();

#endif
