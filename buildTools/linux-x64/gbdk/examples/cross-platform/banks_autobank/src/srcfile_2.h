#include <gbdk/platform.h>

#ifndef _srcfile_2_h
#define _srcfile_2_h

// "BANKREF_EXTERN()" makes a "BANKREF()" reference
// from another source file accessible for use with "BANK()"
extern const uint8_t some_const_var_2;
BANKREF_EXTERN(some_const_var_2)

// Reference for a banked function
void func_2() BANKED;
BANKREF_EXTERN(func_2)

#endif