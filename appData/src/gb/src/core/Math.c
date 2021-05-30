#include "Math.h"

#include <gb/gb.h>

INT16 DespRight(INT16 a, INT16 b) {
  return a >> b;
}

UBYTE Lt16(UINT16 a, UINT16 b) {
  UBYTE a_hi = a >> 8;
  UBYTE b_hi = b >> 8;
  UBYTE a_lo = a & 0xFF;
  UBYTE b_lo = b & 0xFF;
  return a_hi < b_hi || (a_hi == b_hi && a_lo < b_lo);
}

UBYTE Gt16(UINT16 a, UINT16 b) {
  UBYTE a_hi = a >> 8;
  UBYTE b_hi = b >> 8;
  UBYTE a_lo = a & 0xFF;
  UBYTE b_lo = b & 0xFF;
  return a_hi > b_hi || (a_hi == b_hi && a_lo > b_lo);
}
