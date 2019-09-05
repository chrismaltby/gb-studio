/** @file gbdk-lib.h
    Settings for the greater library system.
*/
/** @mainpage 	Gameboy Development Kit Library (gbdk-lib) documentation.
    
    The following pages document a good size chunk of the libraries
    that go along with gbdk.  They were automatically generated from
    the header files using <tt>doxygen libc.dox</tt>

    Thanks to quang for many of the comments to the gb functions.  Some
    of the comments are ripped directly from the Linux Programmers
    manual, and some directly from the pan/k00Pa document.

    Links:

    <a href="http://quangdx.com/">quangDX.com</a>

    <a href="http://www.devrs.com/gb/">Jeff Frohwein's GB development page.</a>
    A good source of all information gb related, including GeeBee's GB faq and the pan/k00Pa document.

    <a href="http://gbdk.sourceforge.net/">The gbdk homepage.</a>
*/
#ifndef GBDK_LIB_INCLUDE
#define GBDK_LIB_INCLUDE

#define USE_C_MEMCPY		1
#define USE_C_STRCPY		1
#define USE_C_STRCMP		1

#if SDCC_PORT==gbz80
#include <asm/gbz80/provides.h>
#elif SDCC_PORT==z80
#include <asm/z80/provides.h>
#else
#error Unrecognised port.
#endif

#endif
