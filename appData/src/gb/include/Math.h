#ifndef MATH_H
#define MATH_H

#include <gb/gb.h>

#include "asm/types.h"

INT16 DespRight(INT16 a, INT16 b);
UBYTE Lt16(UINT16 a, UINT16 b);
UBYTE Gt16(UINT16 a, UINT16 b);

#define IS_NEG(a) ((UBYTE)(a)&0x80)

#define U_LESS_THAN(A, B) ((A) - (B)&0x8000u)
#define UBYTE_LESS_THAN(A, B) ((A) - (B)&0x80u)

#define U_GT_THAN(A, B) ((B) - (A)&0x8000u)
#define UBYTE_GT_THAN(A, B) ((B) - (A)&0x80u)

#define DISTANCE(A, B) (U_LESS_THAN(A, B) ? (B - A) : (A - B))

#define MIN(a, b) (((a) < (b)) ? (a) : (b))
#define MAX(a, b) (((a) > (b)) ? (a) : (b))
#define CLAMP(a, min, max) (((a) < (min)) ? (min) : (((a) > (max)) ? (max) : (a)))

#define SET_BIT(N, POS) N |= 1 << POS
#define UNSET_BIT(N, POS) N &= ~(1 << POS)
#define GET_BIT(N, POS) ((N & (1 << POS)) != 0)

#define SET_BIT_MASK(N, MASK) N |= MASK
#define UNSET_BIT_MASK(N, MASK) N &= ~MASK
#define GET_BIT_MASK(N, MASK) (N & MASK)

#define MOD_2(a) ((a)&1)
#define MOD_4(a) ((a)&3)
#define MOD_8(a) ((a)&7)
#define MOD_16(a) ((a)&15)
#define MOD_32(a) ((a)&31)
#define MOD_64(a) ((a)&63)
#define MOD_128(a) ((a)&127)

#define MUL_16(a) ((a) << 4)
#define MUL_8(a) ((a) << 3)
#define MUL_4(a) ((a) << 2)
#define MUL_2(a) ((a) << 1)

#define DIV_16(a) ((a) >> 4)
#define DIV_8(a) ((a) >> 3)
#define DIV_4(a) ((a) >> 2)
#define DIV_2(a) ((a) >> 1)

typedef struct _Pos {
  WORD x;
  WORD y;
} Pos;

typedef struct _Vector2D {
  BYTE x;
  BYTE y;
} Vector2D;

typedef enum {
  OPERATOR_EQ = 1,
  OPERATOR_NE,
  OPERATOR_LT,
  OPERATOR_GT,
  OPERATOR_LTE,
  OPERATOR_GTE
} OPERATOR_TYPE;

#endif
