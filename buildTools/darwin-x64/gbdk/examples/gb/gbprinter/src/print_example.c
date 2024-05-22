#include <gbdk/platform.h>
#include <stdio.h>
#include <stdbool.h>

#include "gbprinter.h"

#include "res/scene00001.h"

bool printer_check_cancel(void) {
    static uint8_t keys = 0, old_keys;
    old_keys = keys; keys = joypad();
    return (((old_keys ^ keys) & J_B) & (keys & J_B));
}

void main(void) {
    while(1) {
        puts("Press A to print");
        waitpad(J_A);
	if (gbprinter_detect(PRINTER_DETECT_TIMEOUT) == PRN_STATUS_OK) {
            if (gbprinter_print_image(scene00001_map, scene00001_tiles,
                                      (PRN_TILE_WIDTH - (scene00001_WIDTH / scene00001_TILE_W)) / 2,
                                      (scene00001_WIDTH / scene00001_TILE_W), (scene00001_HEIGHT / scene00001_TILE_H)) == PRN_STATUS_OK) {
                puts("Printed OK!");
            } else {
                puts("Print error!");
            }
	} else {
            puts("No printer!");
	}
	waitpadup();
    }
}