#include <gbdk/platform.h>

#ifndef _srcfile_1_h
#define _srcfile_1_h

// "BANKREF_EXTERN()" makes a "BANKREF()" reference
// from another source file accessible for use with "BANK()"
extern const uint8_t some_const_var_1;
BANKREF_EXTERN(some_const_var_1)

// Reference for a banked function
void func_1() BANKED;
BANKREF_EXTERN(func_1)

#endif