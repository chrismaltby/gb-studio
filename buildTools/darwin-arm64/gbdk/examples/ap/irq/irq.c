#include <gb/gb.h>
#include <gbdk/console.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

// counters are 16-bit so we need a mutual exclusion access
unsigned int vbl_cnt, tim_cnt;

void vbl()
{
  // Upon IRQ, interrupts are automatically disabled 
  vbl_cnt++;
}

void tim()
{
  // Upon IRQ, interrupts are automatically disabled
  tim_cnt++;
}

void print_counter()
{
    unsigned int cnt;

    // Ensure mutual exclusion 
    CRITICAL { 
        cnt = tim_cnt; 
    }

    printf(" TIM %u", cnt);
    gotoxy(9, posy());

    // Ensure mutual exclusion
    CRITICAL { 
        cnt = vbl_cnt; 
    }

    printf("- VBL %u\n", cnt);
}

void main()
{
    // Ensure mutual exclusion
    CRITICAL {
        vbl_cnt = tim_cnt = 0;
        add_VBL(vbl);
        add_TIM(tim);
    }

    // Set TMA to divide clock by 0x100
    TMA_REG = 0x00U;
    // Set clock to 4096 Hertz 
    TAC_REG = 0x04U;
    // Handle VBL and TIM interrupts
    set_interrupts(VBL_IFLAG | TIM_IFLAG);

    while(1) {
        print_counter();
        delay(1000UL);
    }
}
