/** @file gbdk-lib.h
    Settings for the greater library system.
*/
/** @mainpage 	Game Boy Development Kit 2020 API (gbdk-lib) documentation

    The following pages document much of the API for GBDK 2020.
    They were automatically generated from the header files using Doxygen.


    For the rest of the documentation, see (link to main GBDK docs here)

    - - - - - -
    __Historical Information and Links from the original doc authors:__

    Thanks to quang for many of the comments to the gb functions.  Some
    of the comments are ripped directly from the Linux Programmers
    manual, and some directly from the pan/k00Pa document.

    <a href="http://quangdx.com/">quangDX.com</a>

    <a href="http://gbdk.sourceforge.net/">The original gbdk homepage</a>

    <a href="http://www.devrs.com/gb/">Jeff Frohwein's GB development page.</a>
    A extensive source of Game Boy related information, including GeeBee's GB faq and the pan/k00Pa document.

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
