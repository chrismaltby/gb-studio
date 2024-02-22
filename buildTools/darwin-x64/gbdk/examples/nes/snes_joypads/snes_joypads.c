/*
    snes_joypads.c

    An example of reading SNES joypad input on NES.
    
    Displays the status of keys pressed on the screen,
    in the following format: (or whitespace when not pressed)
    
    JOYn: lrud SELECT START YBXALR

    SNES joypads use the same protocol as NES joypads, with
    the number of valid bits on the serial interface being 
    greater for a SNES joypad. Even though the physical
    connectors differ, simple adapters can be built from
    extension coords.
    
    Because the "Four Score" 4-player adapter for the NES reports
    2 joypads in two separate bytes read serially, it can 
    easily be repurposed for 2 SNES joypads, by reinterpreting
    the two bytes for two different NES joypads as the input
    for one SNES joypad.
    
    The extra buttons on a SNES joypad can be quite useful for 
    adding debug functionality to your game while in development.
    They can also be used in your final game - but consider making
    this an optional feature, as not everyone will have a 
    SNES-to-NES joypad adapter, or be keen on the idea of using
    SNES joypads on a NES.
*/

#include <stdio.h>
#include <gbdk/platform.h>
#include <gbdk/font.h>
#include <gbdk/console.h>

#define JS_X J_B
#define JS_Y J_B
#define JS_B J_A 
#define JS_A J_A
#define JS_L J_SELECT 
#define JS_R J_START

joypads_t joypads;

void main(void)
{
    font_t ibm_font;
    int i;
    // Init font system and load font
    font_init();
    ibm_font = font_load(font_ibm);
    // 4 NES joypads = 2 SNES joypads
    joypad_init(4, &joypads);
    DISPLAY_ON;
    while(TRUE)
    {
        // poll 4 NES joypads
        joypad_ex(&joypads);
        // Loop over 2 SNES joypads
        for(i = 0; i < 2; i++)
        {
            int y = 4 + 2*i;
            uint8_t joy = joypads.joypads[i];     // Common NES/SNES bits
            uint8_t joy_s = joypads.joypads[i+2]; // SNES additional bits
            gotoxy(1, y);
            printf("JOY%d: ", i);
            putchar((joy & J_LEFT)   ? 'l' : ' ');
            putchar((joy & J_RIGHT)  ? 'r' : ' ');
            putchar((joy & J_UP)     ? 'u' : ' ');
            putchar((joy & J_DOWN)   ? 'd' : ' ');
            printf( (joy & J_SELECT) ? "SELECT " : "       ");
            printf( (joy & J_START)  ? "START "  : "      ");
            putchar((joy & JS_Y)     ? 'Y' : ' ');
            putchar((joy & JS_B)     ? 'B' : ' ');
            putchar((joy_s & JS_X)   ? 'X' : ' ');
            putchar((joy_s & JS_A)   ? 'A' : ' ');
            putchar((joy_s & JS_L)   ? 'L' : ' ');
            putchar((joy_s & JS_R)   ? 'R' : ' ');

        }
        vsync();
    }
}
