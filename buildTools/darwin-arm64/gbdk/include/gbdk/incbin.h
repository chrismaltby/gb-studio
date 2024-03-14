/** @file gbdk/incbin.h

    Allows binary data from other files to be included
    into a C source file.

    It is implemented using asm .incbin and macros.

    See the `incbin` example project for a demo of how to use it.
*/
#ifndef _INCBIN_H
#define _INCBIN_H

#include <stdint.h>


/** Creates extern entries for accessing a INCBIN() generated
    variable and it's size in another source file.

    @param VARNAME Name of the variable used with INCBIN

    An entry is created for the variable and it's size variable.

    @ref INCBIN(), INCBIN_SIZE()
*/
#define INCBIN_EXTERN(VARNAME)  extern const uint8_t VARNAME[]; \
extern const void __size_ ## VARNAME; \
extern const void __bank_ ## VARNAME;

/** Obtains the __size in bytes__ of the INCBIN() generated data

    @param VARNAME Name of the variable used with INCBIN

    Requires @ref INCBIN_EXTERN() to have been called earlier in the source file

    @ref INCBIN(), INCBIN_EXTERN()
*/
#define INCBIN_SIZE(VARNAME) ( (uint16_t) & __size_ ## VARNAME )

/** Obtains the __bank number__ of the INCBIN() generated data

    @param VARNAME Name of the variable used with INCBIN

    Requires @ref INCBIN_EXTERN() to have been called earlier in the source file

    @ref INCBIN(), INCBIN_EXTERN()
*/
#ifndef BANK
#define BANK(VARNAME) ( (uint8_t) & __bank_ ## VARNAME )
#endif

/** Includes binary data into a C source file

    @param VARNAME Variable name to use
    @param FILEPATH Path to the file which will be binary included into the C source file

    __filepath__ is relative to the working directory of the tool
    that is calling it (often a makefile's working directory), __NOT__
    to the file it's being included into.

    The variable name is not modified and can be used as-is.

    The INCBIN() macro will declare the @ref BANK() and @ref INCBIN_SIZE()
    helper symbols. Then if @ref INCBIN_EXTERN() is used in the header then
    those helper macros can be used in the application code.
    - @ref INCBIN_SIZE() for obtaining the size of the included data.
    - @ref BANK() for obtaining the bank number of the included data.

    Use @ref INCBIN_EXTERN() within another source file
    to make the variable and it's data accessible there.

==============

*/
#define INCBIN(VARNAME, FILEPATH) void __func_ ## VARNAME(void) __banked __naked { \
__asm \
_ ## VARNAME:: \
1$: \
    .incbin FILEPATH \
2$: \
    ___size_ ## VARNAME = (2$-1$) \
    .globl ___size_ ## VARNAME \
    .local b___func_ ## VARNAME \
    ___bank_ ## VARNAME = b___func_ ## VARNAME \
    .globl ___bank_ ## VARNAME \
__endasm; \
}

#endif // _INCBIN_H