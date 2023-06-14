#include <gbdk/platform.h>

#ifndef _srcfile_4_h
#define _srcfile_4_h

// "BANKREF_EXTERN()" makes a "BANKREF()" reference
// from another source file accessible for use with "BANK()"
extern const uint8_t some_const_var_4;
BANKREF_EXTERN(some_const_var_4)

// Reference for a banked function
void func_4() BANKED;
BANKREF_EXTERN(func_4)

#endif