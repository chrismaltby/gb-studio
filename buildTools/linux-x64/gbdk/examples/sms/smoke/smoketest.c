#include <sms/sms.h>

BANKREF_EXTERN(earth_data)
extern const unsigned char earth_data[];

BANKREF_EXTERN(earth_data_size)
extern const unsigned int earth_data_size;

const uint8_t tilemap[] = {2, 4, 6, 8, 3, 5, 7, 9};
const uint16_t tilemapw[] = {2, 4, 6, 8, 3, 5, 7, 9};

uint16_t banked_func(uint8_t be, uint8_t ef) __banked;

int16_t x = 8 << 4, y = 0;
int8_t xspd = 0, yspd  = 0;

uint8_t anim = 0, tick = 0;

joypads_t joy;
void main() {
    HIDE_LEFT_COLUMN;
    SPRITES_8x16;
    DISPLAY_ON;

//  vmemcpy(0x4000, earth_data, sizeof(earth_data));

    SWITCH_ROM(BANK(earth_data));
    if (banked_func(0xBE, 0xEF) == 0xBEEF) {
        set_bkg_data(2, earth_data_size >> 4, earth_data);
        set_sprite_data(0, earth_data_size >> 4, earth_data);
        set_sprite_tile(0, 0);
        set_sprite_tile(1, 2);
    }

    set_bkg_tiles(4, 10, 4, 2, tilemap);

    set_tile_map(4, 16, 4, 2, tilemapw);

    joypad_init(2, &joy);

    while(TRUE) {
        joypad_ex(&joy);

        if (joy.joy0 & J_LEFT) {            
            if (xspd > -32) xspd -= 2; 
        } else if (joy.joy0 & J_RIGHT) {
            if (xspd < 32) xspd += 2;
        } else {
            if (xspd < 0) xspd++; else if (xspd > 0) xspd--;            
        }
        
        if (joy.joy0 & J_UP) {
            if (yspd > -32) yspd -= 2; 
        } else if (joy.joy0 & J_DOWN) {
            if (yspd < 32) yspd += 2;
        } else {
            if (yspd < 0) yspd++; else if (yspd > 0) yspd--;
        }

        x += xspd;
        if (x < (8 << 4)) x = 8 << 4; else if (x > (30 * 8) << 4) x = (30 * 8) << 4;

        
        y += yspd;
        if (y < 0) y = 0; else if (y > (22 * 8) << 4) y = (22 * 8) << 4;
        
        tick++; tick &= 7;
        if (!tick) {
            anim++; if (anim == 7) anim = 0;
            set_sprite_tile(0, anim << 2);
            set_sprite_tile(1, (anim << 2) + 2);
        }

        move_sprite(0, x >> 4, y >> 4);
        move_sprite(1, (x >> 4) + 8, y >> 4);

        if (joy.joy1 & J_LEFT) {
            scroll_bkg(-1, 0);
        } else if (joy.joy1 & J_RIGHT) {
            scroll_bkg(1, 0);
        }
        if (joy.joy1 & J_UP) {
            scroll_bkg(0, -1);
        } else if (joy.joy1 & J_DOWN) {
            scroll_bkg(0, 1);
        }
        
        wait_vbl_done();
    }
}
