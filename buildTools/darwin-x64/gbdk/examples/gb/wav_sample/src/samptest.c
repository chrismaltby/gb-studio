#include <gb/gb.h>
#include <stdio.h>

#include "sample_player.h"

#include "samples_bank2.h"
#include "samples_bank3.h" 


void main()
{

    NR52_REG = 0x80u;
    NR51_REG = 0xffu;
    NR50_REG = 0x77u;

    __critical {
        TMA_REG = 0xC0u, TAC_REG = 0x07u;
        add_TIM(play_isr);    
        set_interrupts(VBL_IFLAG | TIM_IFLAG);
    }

    puts("PRESS A/B TO PLAY\n");

    while(1)
    {
        UINT8 j = joypad();
        if (j & J_A) {
            play_sample1();
            while (joypad() & J_A) wait_vbl_done();
        } else
        if (j & J_B) {
            play_sample2();
            while (joypad() & J_B) wait_vbl_done();
        }
        wait_vbl_done();
    }
}
