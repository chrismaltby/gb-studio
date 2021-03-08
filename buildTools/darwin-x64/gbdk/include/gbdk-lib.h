/** @file gbdk-lib.h
    Settings for the greater library system.
*/
#ifndef GBDK_LIB_INCLUDE
#define GBDK_LIB_INCLUDE

#if SDCC_PORT==gbz80
#include <asm/gbz80/provides.h>
#elif SDCC_PORT==z80
#include <asm/z80/provides.h>
#else
#error Unrecognised port.
#endif

#ifndef USE_C_MEMCPY
#define USE_C_MEMCPY		1
#endif
#ifndef USE_C_STRCPY
#define USE_C_STRCPY		1
#endif
#ifndef USE_C_STRCMP
#define USE_C_STRCMP		1
#endif

#endif
