#ifndef MATH_H
#define MATH_H

#include <gb/gb.h>

#include <stdint.h>
#include <stdbool.h>

#include "asm/types.h"

#define IS_NEG(a) ((uint8_t)(a)&0x80)

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

#define SIN(a)  (sine_wave[(uint8_t)(a)])
#define COS(a)  (sine_wave[(uint8_t)((uint8_t)(a) + 64u)])

#define ANGLE_UP        0
#define ANGLE_RIGHT     64
#define ANGLE_DOWN      128
#define ANGLE_LEFT      192

#define ANGLE_0DEG      0
#define ANGLE_45DEG     32
#define ANGLE_90DEG     64
#define ANGLE_135DEG    96
#define ANGLE_180DEG    128
#define ANGLE_225DEG    160
#define ANGLE_270DEG    192
#define ANGLE_315DEG    224

#define FLIPPED_DIR(dir) MOD_4((dir) + 2)
#define IS_DIR_HORIZONTAL(dir) ((dir)&01)
#define IS_DIR_VERTICAL(dir) (!((dir)&01))

#define N_DIRECTIONS    4

typedef struct upoint16_t {
    uint16_t x, y;
} upoint16_t;

typedef struct point16_t {
    int16_t x, y;
} point16_t;

typedef struct point8_t {
    int8_t x, y;
} point8_t;

typedef enum {
    DIR_DOWN = 0,
    DIR_RIGHT,
    DIR_UP,
    DIR_LEFT,
    DIR_NONE
} direction_e;

extern const int8_t sine_wave[256];
extern const point8_t dir_lookup[4];
extern const uint8_t dir_angle_lookup[4];

inline void point_translate_dir(upoint16_t *point, direction_e dir, uint8_t speed) {
    point->x += (int16_t)(dir_lookup[dir].x * speed);
    point->y += (int16_t)(dir_lookup[dir].y * speed);
}

inline void point_translate_dir_word(upoint16_t *point, direction_e dir, uint16_t speed) {
    point->x += (int16_t)(dir_lookup[dir].x * speed);
    point->y += (int16_t)(dir_lookup[dir].y * speed);
}

inline void point_translate_angle(upoint16_t *point, uint8_t angle, uint8_t speed) {
    point->x += ((SIN(angle) * (speed)) >> 7);
    point->y -= ((COS(angle) * (speed)) >> 7);
}

inline void point_translate_angle_to_delta(point16_t *point, uint8_t angle, uint8_t speed) {
    point->x = ((SIN(angle) * (speed)) >> 7);
    point->y = ((COS(angle) * (speed)) >> 7);
}

uint8_t isqrt(uint16_t x) NONBANKED;

#endif
