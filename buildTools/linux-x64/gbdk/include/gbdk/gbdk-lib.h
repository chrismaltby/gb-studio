/** @file gbdk/gbdk-lib.h
    Settings for the greater library system.
*/
#ifndef GBDK_LIB_INCLUDE
#define GBDK_LIB_INCLUDE

#if defined(__PORT_sm83)
  #include <asm/sm83/provides.h>
#elif defined(__PORT_z80)
  #include <asm/z80/provides.h>
#elif defined(__PORT_mos6502)
  #include <asm/mos6502/provides.h>
#else
  #error Unrecognized port
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
