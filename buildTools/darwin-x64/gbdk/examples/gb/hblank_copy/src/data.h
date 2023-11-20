#ifndef __DATA_H_INCLUDE__
#define __DATA_H_INCLUDE__

#include <stdint.h>

// width and height of the map
#define MAP_WIDTH 14
#define MAP_HEIGHT 9

// number of animation frames
#define ANIMATION_FRAME_COUNT 64

typedef struct frame_desc_t {
    const uint8_t * tiles;
    uint8_t bank;
} frame_desc_t;

extern const frame_desc_t frames[ANIMATION_FRAME_COUNT];

#endif