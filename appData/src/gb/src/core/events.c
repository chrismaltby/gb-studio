#pragma bank 255

#include <string.h>

#include "events.h"
#include "input.h"

script_event_t input_events[8];
UBYTE input_slots[8];

script_event_t timer_events[MAX_CONCURRENT_TIMERS];
timer_time_t timer_values[MAX_CONCURRENT_TIMERS];

void events_init(UBYTE preserve) BANKED {
    if (preserve) {
        for (UBYTE i = 0; i < 8; i++) 
            input_events[i].handle = 0;
    } else {
        memset(input_slots, 0, sizeof(input_slots));
        memset(input_events, 0, sizeof(input_events));
    }
}

void events_update() NONBANKED {
    UBYTE * slot_ptr = input_slots;
    for (UBYTE tmp = joy, key = 1; (tmp); tmp = tmp >> 1, key = key << 1, slot_ptr++) {
        if (tmp & 1) {
            if (*slot_ptr == 0) continue;
            script_event_t * event = &input_events[(*slot_ptr & 0x0f) - 1u];
            if (!event->script_addr) continue;
            if (*slot_ptr & 0x80) joy ^= key;     // reset key bit
            if (last_joy & key) continue;
            if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0))
                script_execute(event->script_bank, event->script_addr, &event->handle, 1, (int)key);
        }
    }
    recent_joy = recent_joy & joy;
}

void timers_init(UBYTE preserve) BANKED {
    if (preserve) {
        for (UBYTE i = 0; i != MAX_CONCURRENT_TIMERS; i++) 
            timer_events[i].handle = 0;
    } else {
        memset(timer_values, 0, sizeof(timer_values));
        memset(timer_events, 0, sizeof(timer_events));
    }
}

void timers_update() NONBANKED {
    timer_time_t * ctimer = timer_values;
    for (UBYTE i = 0; i != MAX_CONCURRENT_TIMERS; i++) {
        if (ctimer->value) {
            if (--ctimer->remains == 0) {
                ctimer->remains = ctimer->value;
                script_event_t * event = &timer_events[i];
                if (!event->script_addr) continue;
                if ((event->handle == 0) || ((event->handle & SCRIPT_TERMINATED) != 0)) {
                    script_execute(event->script_bank, event->script_addr, &event->handle, 0, 0);
                }
            }
        
        }
        ctimer++;
    } 
}