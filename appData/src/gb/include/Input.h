#ifndef INPUT_H
#define INPUT_H

#include <gb/gb.h>
#include <gbdkjs.h>

#include "BankData.h"

/* TRUE if left is being held on dpad */
#define INPUT_LEFT (joy & J_LEFT)

/* TRUE if right is being held on dpad */
#define INPUT_RIGHT (joy & J_RIGHT)

/* TRUE if up is being held on dpad */
#define INPUT_UP (joy & J_UP)

/* TRUE if down is being held on dpad */
#define INPUT_DOWN (joy & J_DOWN)

/* TRUE if A button is being held */
#define INPUT_A (joy & J_A)

/* TRUE if B button is being held */
#define INPUT_B (joy & J_B)

/* TRUE if Start button is being held */
#define INPUT_START (joy & J_START)

/* TRUE if Select button is being held */
#define INPUT_SELECT (joy & J_SELECT)

/* TRUE on first frame that left is pressed on dpad  */
#define INPUT_LEFT_PRESSED ((joy & J_LEFT) && !(last_joy & J_LEFT))

/* TRUE on first frame that right is pressed on dpad  */
#define INPUT_RIGHT_PRESSED ((joy & J_RIGHT) && !(last_joy & J_RIGHT))

/* TRUE on first frame that up is pressed on dpad  */
#define INPUT_UP_PRESSED ((joy & J_UP) && !(last_joy & J_UP))

/* TRUE on first frame that down is pressed on dpad  */
#define INPUT_DOWN_PRESSED ((joy & J_DOWN) && !(last_joy & J_DOWN))

/* TRUE on first frame that A button is pressed */
#define INPUT_A_PRESSED ((joy & J_A) && !(last_joy & J_A))

/* TRUE on first frame that B button is pressed */
#define INPUT_B_PRESSED ((joy & J_B) && !(last_joy & J_B))

/* TRUE on first frame that Start button is pressed */
#define INPUT_START_PRESSED ((joy & J_START) && !(last_joy & J_START))

/* TRUE on first frame that Select button is pressed */
#define INPUT_SELECT_PRESSED ((joy & J_SELECT) && !(last_joy & J_SELECT))

#define NUM_INPUTS 8

extern UBYTE joy;
extern UBYTE last_joy;
extern UBYTE await_input;
extern BankPtr input_script_ptrs[NUM_INPUTS];

void HandleInputScripts();

#endif
