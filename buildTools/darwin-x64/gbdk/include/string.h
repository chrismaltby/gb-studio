/** @file string.h
    Generic string functions.
 */
#ifndef STD_STRING_INCLUDE
#define STD_STRING_INCLUDE

#ifdef __PORT_gbz80
  #include <asm/gbz80/string.h>
#else
  #ifdef __PORT_z80
    #include <asm/z80/string.h>
  #else
    #error Unrecognised port
  #endif
#endif

#endif
