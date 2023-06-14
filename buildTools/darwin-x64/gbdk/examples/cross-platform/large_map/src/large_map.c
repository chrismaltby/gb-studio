#include <stdint.h>

#include <gbdk/platform.h>

#include "bigmap_map.h"
#include "bigmap_tiles.h"

#define camera_max_y ((bigmap_mapHeight - DEVICE_SCREEN_HEIGHT) * 8) 
#define camera_max_x ((bigmap_mapWidth - DEVICE_SCREEN_WIDTH) * 8) 

#if defined(SEGA)
  #define WRAP_SCROLL_Y(y) ((y) % 224u)
  // For SMS, artifacts are already invisible as screen buffer size is larger than screen size
  #define SCROLL_Y_OFFSET 0
#elif defined(NINTENDO)
  #define WRAP_SCROLL_Y(y) y
  // For GB, artifacts are already invisible as screen buffer size is larger than screen size
  #define SCROLL_Y_OFFSET 0
#else
  #define WRAP_SCROLL_Y(y) ((y) % 240u)
  // For other systems assume height of 240 and adjust Y-scroll 4 pixels down to partly hide artifacts in NTSC overscan
  #define SCROLL_Y_OFFSET 4
#endif

#define MIN(A,B) ((A)<(B)?(A):(B))

uint8_t joy;

// current and old positions of the camera in pixels
uint16_t camera_x, camera_y, old_camera_x, old_camera_y;
// current and old position of the map in tiles
uint8_t map_pos_x, map_pos_y, old_map_pos_x, old_map_pos_y;
// redraw flag, indicates that camera position was changed
uint8_t redraw;

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

inline uint8_t update_row_top(uint8_t map_pos_y)
{
#if (DEVICE_SCREEN_BUFFER_HEIGHT == DEVICE_SCREEN_HEIGHT)
    return map_pos_y + 1;
#else
    return map_pos_y;
#endif
}

inline uint8_t update_row_bottom(uint8_t map_pos_y)
{
    return map_pos_y + DEVICE_SCREEN_HEIGHT;
}

void set_camera() {
    // update hardware scroll position
    move_bkg(camera_x, WRAP_SCROLL_Y(camera_y + SCROLL_Y_OFFSET));
    // up or down
    map_pos_y = (uint8_t)(camera_y >> 3u);
    if (map_pos_y != old_map_pos_y) { 
        if (camera_y < old_camera_y) {
            set_bkg_submap(map_pos_x,
                           update_row_top(map_pos_y),
                           MIN(DEVICE_SCREEN_WIDTH + 1, bigmap_mapWidth-map_pos_x),
                           1,
                           bigmap_map,
                           bigmap_mapWidth);
        } else {
            if ((bigmap_mapHeight - DEVICE_SCREEN_HEIGHT) > map_pos_y)
                set_bkg_submap(map_pos_x,
                               update_row_bottom(map_pos_y),
                               MIN(DEVICE_SCREEN_WIDTH + 1, bigmap_mapWidth-map_pos_x),
                               1,
                               bigmap_map,
                               bigmap_mapWidth);     
        }
        old_map_pos_y = map_pos_y; 
    }
    // left or right
    map_pos_x = (uint8_t)(camera_x >> 3u);
    if (map_pos_x != old_map_pos_x) {
        if (camera_x < old_camera_x) {
            set_bkg_submap(update_column_left(map_pos_x),
                           map_pos_y,
                           1,
                           MIN(DEVICE_SCREEN_HEIGHT + 1, bigmap_mapHeight - map_pos_y),
                           bigmap_map,
                           bigmap_mapWidth);     
        } else {
            if ((bigmap_mapWidth - DEVICE_SCREEN_WIDTH) > map_pos_x)
                set_bkg_submap(update_column_right(map_pos_x),
                               map_pos_y,
                               1,
                               MIN(DEVICE_SCREEN_HEIGHT + 1, bigmap_mapHeight - map_pos_y),
                               bigmap_map,
                               bigmap_mapWidth);
        }
        old_map_pos_x = map_pos_x;
    }
    // set old camera position to current camera position
    old_camera_x = camera_x, old_camera_y = camera_y;
}

void main(){
    DISPLAY_OFF;
    set_bkg_data(0, 241u, bigmap_tiles);

    map_pos_x = map_pos_y = 0; 
    old_map_pos_x = old_map_pos_y = 255;
    set_bkg_submap(map_pos_x, map_pos_y, DEVICE_SCREEN_WIDTH, DEVICE_SCREEN_HEIGHT, bigmap_map, bigmap_mapWidth);
    
    camera_x = camera_y = 0;
    old_camera_x = camera_x; old_camera_y = camera_y;

    redraw = FALSE;

    move_bkg(camera_x, WRAP_SCROLL_Y(camera_y + SCROLL_Y_OFFSET));
#if DEVICE_SCREEN_BUFFER_WIDTH == DEVICE_SCREEN_WIDTH
        // On platforms where screen buffer has no more space than physical screen,
        // the next map column will be written to the leftmost screen column.
        // So we blank the leftmost column to hide visual artifacts where possible.
        HIDE_LEFT_COLUMN;
#endif
    SHOW_BKG;
    DISPLAY_ON;
    while (TRUE) {
        joy = joypad();
        // up or down
        if (joy & J_UP) {
            if (camera_y) {
                camera_y--;
                redraw = TRUE;
            }
        } else if (joy & J_DOWN) {
            if (camera_y < camera_max_y) {
                camera_y++;
                redraw = TRUE;
            }
        } 
        // left or right
        if (joy & J_LEFT) {
            if (camera_x) {
                camera_x--;
                redraw = TRUE;
            }
        } else if (joy & J_RIGHT) {
            if (camera_x < camera_max_x) {
                camera_x++;
                redraw = TRUE;
            }
        } 
        if (redraw) {
            wait_vbl_done();
            set_camera();
            redraw = FALSE;
        } else wait_vbl_done();
    }
}