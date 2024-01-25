#include <gb/gb.h>
#include <stdint.h>


void main(void)
{
    // Loop forever
    while(1) {


		// Game main loop processing goes here


		// Done processing, yield CPU and wait for start of next frame
        wait_vbl_done();
    }
}
