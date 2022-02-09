#ifndef HUGEDRIVER_ROUTINES_H_INCLUDE
#define HUGEDRIVER_ROUTINES_H_INCLUDE

#include <gbdk/platform.h>

void hUGETrackerRoutine(unsigned char ch, unsigned char param, unsigned char tick) NONBANKED OLDCALL;

static const hUGERoutine_t routines[] = {
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine
};

#endif