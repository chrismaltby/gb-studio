/*
 */
#ifndef SDCCCONF_HEADER
#define SDCCCONF_HEADER


#define SDCC_VERSION_HI 2
#define SDCC_VERSION_LO 2
#define SDCC_VERSION_P 1
#define SDCC_VERSION_STR "2.2.2"

/* MSVC 6 does not have __FUNCTION__ preprocessor macro defined */

#define __FUNCTION__ __FILE__

#undef PREFIX
#undef DATADIR
#undef SRCDIR

//#define STANDARD_INCLUDE_DIR  "\\sdcc\\local\\share\\include"
#define SDCC_INCLUDE_DIR      "\\sdcc\\include"
#define SDCC_LIB_DIR          "\\sdcc\\lib"
#define STD_LIB               "libsdcc"
#define STD_INT_LIB           "libint"
#define STD_LONG_LIB          "liblong"
#define STD_FP_LIB            "libfloat"
#define STD_DS390_LIB         "libds390"

// #undef HAVE_SYS_SOCKET_H
// #undef HAVE_SYS_ISA_DEFS_H	
// #undef HAVE_ENDIAN_H

#undef HAVE_STRERROR

#undef OPT_DISABLE_Z80
#undef OPT_DISABLE_GBZ80
#undef OPT_DISABLE_MCS51
#undef OPT_DISABLE_AVR
#define OPT_DISABLE_I186      1
#define OPT_DISABLE_TLCS900H  1

#endif

/* End of config.h */
