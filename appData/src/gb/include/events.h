#ifndef _EVENTS_H_INCLUDE
#define _EVENTS_H_INCLUDE

#include "vm.h"

typedef struct script_event_t {
    UWORD handle;
    UBYTE script_bank;
    void * script_addr;
} script_event_t;

extern script_event_t input_events[8];
extern UBYTE input_slots[8]; 

typedef struct timer_time_t {
    UBYTE value, remains;
} timer_time_t;

extern script_event_t timer_events[4];
extern timer_time_t timer_values[4];

void events_init(UBYTE preserve) __banked;
void events_update() __nonbanked;

void timers_init(UBYTE preserve) __banked;
void timers_update() __nonbanked;

#endif