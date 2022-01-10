#ifndef INPUT_H
#define INPUT_H

#include <gb/gb.h>

#ifdef SGB
    #define MAX_JOYPADS 2
#endif
#define joy (frame_joy)

/* TRUE if any button is being held */
#define INPUT_ANY (joy)

/* TRUE if left is being held on dpad */
#define INPUT_LEFT (joy & J_LEFT)

/* TRUE if right is being held on dpad */
#define INPUT_RIGHT (joy & J_RIGHT)

/* TRUE if up is being held on dpad */
#define INPUT_UP (joy & J_UP)

/* TRUE if down is being held on dpad */
#define INPUT_DOWN (joy & J_DOWN)

/* TRUE if left is most recent direction being held on dpad */
#define INPUT_RECENT_LEFT ((recent_joy & J_LEFT) || (!recent_joy && (joy & J_LEFT)))

/* TRUE if right is most recent direction being held on dpad */
#define INPUT_RECENT_RIGHT ((recent_joy & J_RIGHT) || (!recent_joy && (joy & J_RIGHT)))

/* TRUE if up is most recent direction being held on dpad */
#define INPUT_RECENT_UP ((recent_joy & J_UP) || (!recent_joy && (joy & J_UP)))

/* TRUE if down is most recent direction being held on dpad */
#define INPUT_RECENT_DOWN ((recent_joy & J_DOWN) || (!recent_joy && (joy & J_DOWN)))

/* TRUE if A button is being held */
#define INPUT_A (joy & J_A)

/* TRUE if B button is being held */
#define INPUT_B (joy & J_B)

/* TRUE if A OR B button is being held */
#define INPUT_A_OR_B ((joy & (J_A | J_B)) != 0)

/* TRUE if Start button is being held */
#define INPUT_START (joy & J_START)

/* TRUE if Select button is being held */
#define INPUT_SELECT (joy & J_SELECT)

/* TRUE on first frame that any button is pressed */
#define INPUT_ANY_PRESSED (joy && !last_joy)

/* TRUE on first frame that left is pressed on dpad  */
#define INPUT_LEFT_PRESSED ((joy & J_LEFT) && !(last_joy & J_LEFT))

/* TRUE on first frame that right is pressed on dpad  */
#define INPUT_RIGHT_PRESSED ((joy & J_RIGHT) && !(last_joy & J_RIGHT))

/* TRUE on first frame that up is pressed on dpad  */
#define INPUT_UP_PRESSED ((joy & J_UP) && !(last_joy & J_UP))

/* TRUE on first frame that down is pressed on dpad  */
#define INPUT_DOWN_PRESSED ((joy & J_DOWN) && !(last_joy & J_DOWN))

/* TRUE on first frame that button is pressed */
#define INPUT_PRESSED(btn) ((joy & btn) && !(last_joy & btn)) 

/* TRUE on first frame that A button is pressed */
#define INPUT_A_PRESSED ((joy & J_A) && !(last_joy & J_A))

/* TRUE on first frame that B button is pressed */
#define INPUT_B_PRESSED ((joy & J_B) && !(last_joy & J_B))

/* TRUE on first frame that A OR B button is pressed */
#define INPUT_A_OR_B_PRESSED (((joy & (J_A | J_B)) != 0) && ((last_joy & (J_A | J_B)) == 0))

/* TRUE on first frame that Start button is pressed */
#define INPUT_START_PRESSED ((joy & J_START) && !(last_joy & J_START))

/* TRUE on first frame that Select button is pressed */
#define INPUT_SELECT_PRESSED ((joy & J_SELECT) && !(last_joy & J_SELECT))

#define INPUT_SOFT_RESTART (joy == (J_A | J_B | J_START | J_SELECT))

/* resets the input */
#define INPUT_RESET (last_joy = joy)

#define NUM_INPUTS 8

#define INPUT_DPAD 0xF

extern joypads_t joypads;
extern UBYTE frame_joy;
extern UBYTE last_joy;
extern UBYTE recent_joy;

void input_init() BANKED;
void input_update() NONBANKED;

#endif
