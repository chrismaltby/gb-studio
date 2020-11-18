#ifndef __CRASH_HEANDLER_INCLUDE
#define __CRASH_HEANDLER_INCLUDE

void __HandleCrash();
static void * __CRASH_HEANDLER_INIT = &__HandleCrash;

#endif