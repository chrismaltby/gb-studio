/** @file z80/support.h
    Support functions for the z80 port.
*/
#ifndef Z80_SUPPORT_INCLUDE
#define Z80_SUPPORT_INCLUDE

typedef unsigned short WORD;
typedef unsigned char BYTE;

typedef struct
  {
    WORD w[2];
    BYTE b[4];
  }
Z80_FLOAT;

/** Convert a native float into 'z80' format */
int convertFloat (Z80_FLOAT * f, double native);

#endif
