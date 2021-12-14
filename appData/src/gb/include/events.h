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

#define MAX_CONCURRENT_TIMERS 4

extern script_event_t timer_events[MAX_CONCURRENT_TIMERS];
extern timer_time_t timer_values[MAX_CONCURRENT_TIMERS];

void events_init(UBYTE preserve) BANKED;
void events_update() NONBANKED;

void timers_init(UBYTE preserve) BANKED;
void timers_update() NONBANKED;

#endif