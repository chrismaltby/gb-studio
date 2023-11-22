#ifndef HUGEDRIVER_ROUTINES_H_INCLUDE
#define HUGEDRIVER_ROUTINES_H_INCLUDE

#include "hUGEDriver.h"

void hUGETrackerRoutine(unsigned char tick, unsigned int param) NONBANKED;

static const hUGERoutine_t routines[] = {
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine
};

#endif