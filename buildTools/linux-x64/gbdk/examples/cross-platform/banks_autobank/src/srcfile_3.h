#include <gbdk/platform.h>

#ifndef _srcfile_3_h
#define _srcfile_3_h

// "BANKREF_EXTERN()" makes a "BANKREF()" reference
// from another source file accessible for use with "BANK()"
extern const uint8_t some_const_var_3;
BANKREF_EXTERN(some_const_var_3)

// Reference for a banked function
void func_3() BANKED;
BANKREF_EXTERN(func_3)

#endif