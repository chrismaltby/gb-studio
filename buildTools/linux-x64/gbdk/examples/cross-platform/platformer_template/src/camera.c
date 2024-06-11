#pragma bank 255

#include <stdint.h>
#include <gbdk/platform.h>
#include "level.h"

#define WRAP_SCROLL_Y(y) ((y) % DEVICE_SCREEN_PX_HEIGHT)

#if defined(SEGA)
  // For SMS, artifacts are already invisible as screen buffer size is larger than screen size
  #define SCROLL_Y_OFFSET 0
#elif defined(NINTENDO)
  // For GB, artifacts are already invisible as screen buffer size is larger than screen size
  #define SCROLL_Y_OFFSET 0
#else
  // For other systems assume height of 240 and adjust Y-scroll 4 pixels down to partly hide artifacts in NTSC overscan
  #define SCROLL_Y_OFFSET 4
#endif


#define MIN(A,B) ((A)<(B)?(A):(B))

// current and old positions of the camera in pixels
uint16_t camera_x, old_camera_x;
// current and old position of the map in tiles
uint8_t map_pos_x, old_map_pos_x;
// redraw flag, indicates that camera position was changed
uint8_t redraw;

void SetCurrentLevelSubmap(uint8_t x, uint8_t y, uint8_t w, uint8_t h) NONBANKED{
    
    uint8_t _previous_bank = CURRENT_BANK;

    SWITCH_ROM(currentAreaBank);

    set_bkg_submap(x,y,w, h, currentLevelMap, currentLevelWidthInTiles);

    SWITCH_ROM(_previous_bank);
    
}

inline uint8_t update_column_left(uint8_t map_pos_x)
{
#if (DEVICE_SCREEN_BUFFER_WIDTH == DEVICE_SCREEN_WIDTH)
    return map_pos_x + 1;
#else
    return map_pos_x;
#endif
}

inline uint8_t update_column_right(uint8_t map_pos_x)
{
    return map_pos_x + DEVICE_SCREEN_WIDTH;
}

void UpdateCamera(void) BANKED {

    // update hardware scroll position
    move_bkg(camera_x, 0);
    
    // left or right
    map_pos_x = (uint8_t)(camera_x >> 3u);
    if (map_pos_x != old_map_pos_x) {
        if (camera_x < old_camera_x) {
            SetCurrentLevelSubmap(
                    update_column_left(map_pos_x), 
                    0, 
                    1, 
                    MIN(DEVICE_SCREEN_HEIGHT, currentLevelHeightInTiles ));     
        } else {
            if ((currentLevelWidthInTiles - DEVICE_SCREEN_WIDTH) > map_pos_x) {
                SetCurrentLevelSubmap(
                    update_column_right(map_pos_x), 
                    0, 
                    1, 
                    MIN(DEVICE_SCREEN_HEIGHT, currentLevelHeightInTiles));   
            }  
        }
        old_map_pos_x = map_pos_x;
    }
    // set old camera position to current camera position
    old_camera_x = camera_x;
}
