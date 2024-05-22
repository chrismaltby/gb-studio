#include <stdint.h>

#include <gbdk/platform.h>

#include "res/bigmap.h"
#define bigmap_mapWidth (bigmap_WIDTH/bigmap_TILE_W)
#define bigmap_mapHeight (bigmap_HEIGHT/bigmap_TILE_H)

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

#if defined(SEGA)
// The "compatibility" function set_bkg_submap (=set_tile_submap_compat)
// expect maps with only 1-byte-per-tile, only containing either a tile
// index or an attribute.
// But png2asset can only produce 2-byte-per-tile maps where both tile index
// and attribute are consecutive when the -map_attributes parameter is used.
// To work around this, we redefine those functions for SMS/GG only, so
// they work like this:
// * Use set_tile_submap for tile indices, to read/write both bytes of map
// * Make set_submap_attributes a no-op, as attributes were already set
#define set_submap_indices(x, y, w, h, map, map_w) set_tile_submap(x, y, w, h, map_w, map)
#define set_submap_attributes(x, y, w, h, map, map_w)
#else
#define set_submap_indices(x, y, w, h, map, map_w) set_bkg_submap(x, y, w, h, map, map_w)
#define set_submap_attributes(x, y, w, h, map, map_w) set_bkg_submap_attributes(x, y, w, h, map, map_w)
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

void set_camera(void)
{
    // update hardware scroll position
    move_bkg(camera_x, WRAP_SCROLL_Y(camera_y + SCROLL_Y_OFFSET));
    // up or down
    map_pos_y = (uint8_t)(camera_y >> 3u);
    if (map_pos_y != old_map_pos_y)
    { 
        if (camera_y < old_camera_y)
        {
            set_submap_indices(
                map_pos_x,
                update_row_top(map_pos_y),
                MIN(DEVICE_SCREEN_WIDTH + 1, bigmap_mapWidth-map_pos_x),
                1,
                bigmap_map,
                bigmap_mapWidth);
            set_submap_attributes(
                map_pos_x,
                update_row_top(map_pos_y),
                MIN(DEVICE_SCREEN_WIDTH + 1, bigmap_mapWidth-map_pos_x),
                1,
                bigmap_map_attributes,
                bigmap_mapWidth);
        }
        else
        {
            if ((bigmap_mapHeight - DEVICE_SCREEN_HEIGHT) > map_pos_y)
            {
                set_submap_indices(
                    map_pos_x,
                    update_row_bottom(map_pos_y),
                    MIN(DEVICE_SCREEN_WIDTH + 1, bigmap_mapWidth-map_pos_x),
                    1,
                    bigmap_map,
                    bigmap_mapWidth);
                set_submap_attributes(
                    map_pos_x,
                    update_row_bottom(map_pos_y),
                    MIN(DEVICE_SCREEN_WIDTH + 1, bigmap_mapWidth-map_pos_x),
                    1,
                    bigmap_map_attributes,
                    bigmap_mapWidth);
            }
        }
        old_map_pos_y = map_pos_y; 
    }
    // left or right
    map_pos_x = (uint8_t)(camera_x >> 3u);
    if (map_pos_x != old_map_pos_x)
    {
        if (camera_x < old_camera_x)
        {
            set_submap_indices(
                update_column_left(map_pos_x),
                map_pos_y,
                1,
                MIN(DEVICE_SCREEN_HEIGHT + 1, bigmap_mapHeight - map_pos_y),
                bigmap_map,
                bigmap_mapWidth);
            set_submap_attributes(
                update_column_left(map_pos_x),
                map_pos_y,
                1,
                MIN(DEVICE_SCREEN_HEIGHT + 1, bigmap_mapHeight - map_pos_y),
                bigmap_map_attributes,
                bigmap_mapWidth);
        }
        else
        {
            if ((bigmap_mapWidth - DEVICE_SCREEN_WIDTH) > map_pos_x)
            {
                set_submap_indices(
                    update_column_right(map_pos_x),
                    map_pos_y,
                    1,
                    MIN(DEVICE_SCREEN_HEIGHT + 1, bigmap_mapHeight - map_pos_y),
                    bigmap_map,
                    bigmap_mapWidth);
                set_submap_attributes(
                    update_column_right(map_pos_x),
                    map_pos_y,
                    1,
                    MIN(DEVICE_SCREEN_HEIGHT + 1, bigmap_mapHeight - map_pos_y),
                    bigmap_map_attributes,
                    bigmap_mapWidth);
            }
        }
        old_map_pos_x = map_pos_x;
    }
    // set old camera position to current camera position
    old_camera_x = camera_x, old_camera_y = camera_y;
}


void init_camera(uint8_t x, uint8_t y) {

    // Set up tile data
    set_native_tile_data(0, bigmap_TILE_COUNT, bigmap_tiles);
    
    // Set up color palettes
    #if defined(SEGA)
        __WRITE_VDP_REG(VDP_R2, R2_MAP_0x3800);
        __WRITE_VDP_REG(VDP_R5, R5_SAT_0x3F00);
        set_palette(0, bigmap_PALETTE_COUNT, bigmap_palettes);
    #elif defined(GAMEBOY)
        if (_cpu == CGB_TYPE) {
            set_bkg_palette(BKGF_CGB_PAL0, bigmap_PALETTE_COUNT, bigmap_palettes);
        }
    #elif defined(NINTENDO_NES)
        set_bkg_palette(0, bigmap_PALETTE_COUNT, bigmap_palettes);
    #endif 


    // Initial camera position in pixels set here.
    camera_x = x;
    camera_y = y;
    // Enforce map limits on initial camera position
    if (camera_x > camera_max_x) camera_x = camera_max_x;
    if (camera_y > camera_max_y) camera_y = camera_max_y;
    old_camera_x = camera_x; old_camera_y = camera_y;

    map_pos_x = camera_x >> 3;
    map_pos_y = camera_y >> 3;
    old_map_pos_x = old_map_pos_y = 255;
    move_bkg(camera_x, WRAP_SCROLL_Y(camera_y + SCROLL_Y_OFFSET));

    // Draw the initial map view for the whole screen
    set_submap_indices(
        map_pos_x,
        map_pos_y,
        MIN(DEVICE_SCREEN_WIDTH + 1u, bigmap_mapWidth - map_pos_x),
        MIN(DEVICE_SCREEN_HEIGHT + 1u, bigmap_mapHeight - map_pos_y),
        bigmap_map,
        bigmap_mapWidth);

    set_submap_attributes(
        map_pos_x,
        map_pos_y,
        MIN(DEVICE_SCREEN_WIDTH + 1u, bigmap_mapWidth - map_pos_x),
        MIN(DEVICE_SCREEN_HEIGHT + 1u, bigmap_mapHeight - map_pos_y),
        bigmap_map_attributes,
        bigmap_mapWidth);

    redraw = FALSE;

    move_bkg(camera_x, WRAP_SCROLL_Y(camera_y + SCROLL_Y_OFFSET));
    #if DEVICE_SCREEN_BUFFER_WIDTH == DEVICE_SCREEN_WIDTH
        // On platforms where screen buffer has no more space than physical screen,
        // the next map column will be written to the leftmost screen column.
        // So we blank the leftmost column to hide visual artifacts where possible.
        HIDE_LEFT_COLUMN;
    #endif
}

void main(void){
    DISPLAY_OFF;
    init_camera(0, 0);

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
            vsync();
            set_camera();
            redraw = FALSE;
        } else vsync();
    }
}
