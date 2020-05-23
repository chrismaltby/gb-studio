#ifndef CORE_MAIN_H
#define CORE_MAIN_H

#include <gb/gb.h>
#include <gbdkjs.h>

int core_start();
void SetState(UINT16 state);

extern UINT16 current_state;

#endif
