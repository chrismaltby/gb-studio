#include <sms/sms.h>

BANKREF_EXTERN(earth_data)
extern const unsigned char earth_data[];

BANKREF_EXTERN(earth_data_size)
extern const unsigned int earth_data_size;

const uint8_t tilemap[] = {2, 4, 6, 8, 3, 5, 7, 9};

uint16_t banked_func(uint8_t be, uint8_t ef) __banked;

joypads_t joy;
void main() {
    DISPLAY_ON;

//	vmemcpy(0x4000, earth_data, sizeof(earth_data));

    SWITCH_ROM(BANK(earth_data));
    if (banked_func(0xBE, 0xEF) == 0xBEEF) {
        set_bkg_2bpp_data(2, earth_data_size >> 4, earth_data);
    }

    set_bkg_tiles(4, 10, 4, 2, tilemap);

    joypad_init(2, &joy);

    while(TRUE) {
        joypad_ex(&joy);

        if (joy.joy0 & J_LEFT) {
            scroll_bkg(-1, 0);
        } else if (joy.joy0 & J_RIGHT) {
            scroll_bkg(1, 0);
        }
        if (joy.joy0 & J_UP) {
            scroll_bkg(0, -1);
        } else if (joy.joy0 & J_DOWN) {
            scroll_bkg(0, 1);
        }

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
