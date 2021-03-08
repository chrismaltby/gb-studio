#pragma bank 3

#include <string.h>

#include "events.h"
#include "input.h"

script_event_t input_events[8];
UBYTE input_slots[8];

script_event_t timer_events[4];
timer_time_t timer_values[4];

void events_init(UBYTE preserve) __banked {
    if (preserve) {
        for (UBYTE i = 0; i < 8; i++) 
            input_events[i].handle = 0;
    } else {
        memset(input_slots, 0, sizeof(input_slots));
        memset(input_events, 0, sizeof(input_events));
    }
}

void events_update() __nonbanked {
    UBYTE * slot = input_slots;
    for (UBYTE tmp = joy, key = 1; (tmp); tmp = tmp >> 1, key = key << 1, slot++) {
        if (tmp & 1) {
            if (*slot == 0) continue;
            script_event_t * event = &input_events[*slot - 1u];
            if (!event->script_addr) continue;
            if ((event->handle == 0) || ((event->handle & 0x8000) != 0))
                script_execute(event->script_bank, event->script_addr, &event->handle, 1, (int)key);
        }
    }
}

void timers_init(UBYTE preserve) __banked {
    if (preserve) {
        for (UBYTE i = 0; i < 4; i++) 
            timer_events[i].handle = 0;
    } else {
        memset(timer_values, 0, sizeof(timer_values));
        memset(timer_events, 0, sizeof(timer_events));
    }
}

void timers_update() __nonbanked {
    for (UBYTE i = 0; i < 4; i++) {
        if  (timer_values[i].value) {
            if (timer_values[i].remains == 0) {                
                script_event_t * event = &timer_events[i];
                if (!event->script_addr) continue;
                if ((event->handle == 0) || ((event->handle & 0x8000) != 0)) {
                    script_execute(event->script_bank, event->script_addr, &event->handle, 0, 0);
                    timer_values[i].remains = timer_values[i].value;
                }
            } else timer_values[i].remains--;
        }
    } 
}