#ifndef INPUT_H
#define INPUT_H

#include <gbdkjs.h>
#include <gb/gb.h>
#include "BankData.h"

#define INPUT_LEFT (joy & J_LEFT)
#define INPUT_RIGHT (joy & J_RIGHT)
#define INPUT_UP (joy & J_UP)
#define INPUT_DOWN (joy & J_DOWN)
#define INPUT_A (joy & J_A)
#define INPUT_B (joy & J_B)
#define INPUT_START (joy & J_START)
#define INPUT_SELECT (joy & J_SELECT)

#define INPUT_LEFT_PRESSED ((joy & J_LEFT) && !(last_joy & J_LEFT))
#define INPUT_RIGHT_PRESSED ((joy & J_RIGHT) && !(last_joy & J_RIGHT))
#define INPUT_UP_PRESSED ((joy & J_UP) && !(last_joy & J_UP))
#define INPUT_DOWN_PRESSED ((joy & J_DOWN) && !(last_joy & J_DOWN))
#define INPUT_A_PRESSED ((joy & J_A) && !(last_joy & J_A))
#define INPUT_B_PRESSED ((joy & J_B) && !(last_joy & J_B))
#define INPUT_START_PRESSED ((joy & J_START) && !(last_joy & J_START))
#define INPUT_SELECT_PRESSED ((joy & J_SELECT) && !(last_joy & J_SELECT))

#define NUM_INPUTS 8

extern UBYTE joy;
extern UBYTE last_joy;
extern UBYTE await_input;
extern BankPtr input_script_ptrs[NUM_INPUTS];

UBYTE AwaitInputPressed();
void HandleInputScripts();

#endif
