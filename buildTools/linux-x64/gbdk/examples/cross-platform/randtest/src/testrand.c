/*
    fonts.c
    Simple example of how to use multiple fonts on the GB
    Michael Hope, 1999.
*/

#include <stdio.h>
#include <rand.h>

#include <gbdk/platform.h>

#include <gbdk/console.h>

void main(void)
{
    while(TRUE) {
        puts("press A...");
        waitpad(J_A);
        initarand(sys_time);
        for (uint8_t i = 0; i != 16; i++) 
            printf("rand=%hx arand=%hx\n", (uint8_t)rand(), (uint8_t)arand());
    }
}

    
    
