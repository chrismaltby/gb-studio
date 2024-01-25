#include <gb/gb.h>
#include <stdint.h>

#include "bigmap_map.h"
#include "bigmap_tiles.h"

#define camera_max_y ((bigmap_mapHeight - 18) * 8) 
#define camera_max_x ((bigmap_mapWidth - 20) * 8) 

#define MIN(A,B) ((A)<(B)?(A):(B))

uint8_t joy;

// current and old positions of the camera in pixels
uint16_t camera_x, camera_y, old_camera_x, old_camera_y;
// current and old position of the map in tiles
uint8_t map_pos_x, map_pos_y, old_map_pos_x, old_map_pos_y;
// redraw flag, indicates that camera position was changed
uint8_t redraw;

void set_camera() {
    // update hardware scroll position
    SCY_REG = camera_y; SCX_REG = camera_x; 
    // up or down
    map_pos_y = (uint8_t)(camera_y >> 3u);
    if (map_pos_y != old_map_pos_y) { 
        if (camera_y < old_camera_y) {
            set_bkg_submap(map_pos_x, map_pos_y, MIN(21u, bigmap_mapWidth-map_pos_x), 1, bigmap_map, bigmap_mapWidth);
        } else {
            if ((bigmap_mapHeight - 18u) > map_pos_y) set_bkg_submap(map_pos_x, map_pos_y + 18u, MIN(21u, bigmap_mapWidth-map_pos_x), 1, bigmap_map, bigmap_mapWidth);     
        }
        old_map_pos_y = map_pos_y; 
    }
    // left or right
    map_pos_x = (uint8_t)(camera_x >> 3u);
    if (map_pos_x != old_map_pos_x) {
        if (camera_x < old_camera_x) {
            set_bkg_submap(map_pos_x, map_pos_y, 1, MIN(19u, bigmap_mapHeight - map_pos_y), bigmap_map, bigmap_mapWidth);     
        } else {
            if ((bigmap_mapWidth - 20u) > map_pos_x) set_bkg_submap(map_pos_x + 20u, map_pos_y, 1, MIN(19u, bigmap_mapHeight - map_pos_y), bigmap_map, bigmap_mapWidth);     
        }
        old_map_pos_x = map_pos_x;
    }
    // set old camera position to current camera position
    old_camera_x = camera_x, old_camera_y = camera_y;
}

void main(){
    DISPLAY_OFF;
    SHOW_BKG;
    set_bkg_data(0, 241u, bigmap_tiles);

    map_pos_x = map_pos_y = 0; 
    old_map_pos_x = old_map_pos_y = 255;
    set_bkg_submap(map_pos_x, map_pos_y, 20, 18, bigmap_map, bigmap_mapWidth);
    DISPLAY_ON;
    
    camera_x = camera_y = 0;
    old_camera_x = camera_x; old_camera_y = camera_y;

    redraw = FALSE;

    SCX_REG = camera_x; SCY_REG = camera_y; 
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