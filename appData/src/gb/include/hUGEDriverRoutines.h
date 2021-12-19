#ifndef HUGEDRIVER_ROUTINES_H_INCLUDE
#define HUGEDRIVER_ROUTINES_H_INCLUDE

void hUGETrackerRoutine(unsigned char ch, unsigned char param, unsigned char tick) __nonbanked;

static const hUGERoutine_t routines[] = {
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine,
    hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine, hUGETrackerRoutine
};

#endif