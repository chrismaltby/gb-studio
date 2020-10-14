#ifndef INPUT_H
#define INPUT_H

#include <gb/gb.h>

#include "BankData.h"
#include "UI.h"

#define ALLOW_DEFAULT_INPUT_RIGHT (ui_block || !GET_BIT(input_override_default,0))
#define ALLOW_DEFAULT_INPUT_LEFT (ui_block || !GET_BIT(input_override_default,1))
#define ALLOW_DEFAULT_INPUT_UP (ui_block || !GET_BIT(input_override_default,2))
#define ALLOW_DEFAULT_INPUT_DOWN (ui_block || !GET_BIT(input_override_default,3))
#define ALLOW_DEFAULT_INPUT_A (ui_block || !GET_BIT(input_override_default,4))
#define ALLOW_DEFAULT_INPUT_B (ui_block || !GET_BIT(input_override_default,5))

/* TRUE if left is being held on dpad */
#define INPUT_LEFT (ALLOW_DEFAULT_INPUT_LEFT && (joy & J_LEFT))

/* TRUE if right is being held on dpad */
#define INPUT_RIGHT (ALLOW_DEFAULT_INPUT_RIGHT && (joy & J_RIGHT))

/* TRUE if up is being held on dpad */
#define INPUT_UP (ALLOW_DEFAULT_INPUT_UP && (joy & J_UP))

/* TRUE if down is being held on dpad */
#define INPUT_DOWN (ALLOW_DEFAULT_INPUT_DOWN && (joy & J_DOWN))

/* TRUE if left is being held on dpad */
#define INPUT_RECENT_LEFT (ALLOW_DEFAULT_INPUT_LEFT && ((recent_joy & J_LEFT) || (!recent_joy && (joy & J_LEFT))))

/* TRUE if right is being held on dpad */
#define INPUT_RECENT_RIGHT (ALLOW_DEFAULT_INPUT_RIGHT && ((recent_joy & J_RIGHT) || (!recent_joy && (joy & J_RIGHT))))

/* TRUE if up is being held on dpad */
#define INPUT_RECENT_UP (ALLOW_DEFAULT_INPUT_UP && ((recent_joy & J_UP) || (!recent_joy && (joy & J_UP))))

/* TRUE if down is being held on dpad */
#define INPUT_RECENT_DOWN (ALLOW_DEFAULT_INPUT_DOWN && ((recent_joy & J_DOWN) || (!recent_joy && (joy & J_DOWN))))

/* TRUE if A button is being held */
#define INPUT_A (ALLOW_DEFAULT_INPUT_A && (joy & J_A))

/* TRUE if B button is being held */
#define INPUT_B (ALLOW_DEFAULT_INPUT_B && (joy & J_B))

/* TRUE if Start button is being held */
#define INPUT_START (joy & J_START)

/* TRUE if Select button is being held */
#define INPUT_SELECT (joy & J_SELECT)

/* TRUE on first frame that left is pressed on dpad  */
#define INPUT_LEFT_PRESSED (ALLOW_DEFAULT_INPUT_LEFT && ((joy & J_LEFT) && !(last_joy & J_LEFT)))

/* TRUE on first frame that right is pressed on dpad  */
#define INPUT_RIGHT_PRESSED (ALLOW_DEFAULT_INPUT_RIGHT && ((joy & J_RIGHT) && !(last_joy & J_RIGHT)))

/* TRUE on first frame that up is pressed on dpad  */
#define INPUT_UP_PRESSED (ALLOW_DEFAULT_INPUT_UP && ((joy & J_UP) && !(last_joy & J_UP)))

/* TRUE on first frame that down is pressed on dpad  */
#define INPUT_DOWN_PRESSED (ALLOW_DEFAULT_INPUT_DOWN && ((joy & J_DOWN) && !(last_joy & J_DOWN)))

/* TRUE on first frame that A button is pressed */
#define INPUT_A_PRESSED (ALLOW_DEFAULT_INPUT_A && ((joy & J_A) && !(last_joy & J_A)))

/* TRUE on first frame that B button is pressed */
#define INPUT_B_PRESSED (ALLOW_DEFAULT_INPUT_B && ((joy & J_B) && !(last_joy & J_B)))

/* TRUE on first frame that Start button is pressed */
#define INPUT_START_PRESSED ((joy & J_START) && !(last_joy & J_START))

/* TRUE on first frame that Select button is pressed */
#define INPUT_SELECT_PRESSED ((joy & J_SELECT) && !(last_joy & J_SELECT))

#define NUM_INPUTS 8

#define INPUT_DPAD 0xF

extern UBYTE joy;
extern UBYTE last_joy;
extern UBYTE recent_joy;
extern UBYTE await_input;
extern BankPtr input_script_ptrs[NUM_INPUTS];
extern UBYTE input_script_persist;
extern UBYTE input_override_default;

/**
 * Check joypad values and run input scripts if required
 */
void HandleInputScripts();

/**
 * Remove all attached input scripts
 */
void RemoveInputScripts();

#endif
