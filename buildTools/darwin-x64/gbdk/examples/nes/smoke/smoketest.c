#include <gbdk/platform.h>

void main() {
    DISPLAY_ON;
    while(TRUE) {
        wait_vbl_done();
    }
}
