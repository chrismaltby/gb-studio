/*
    display_system.c

    Displays the system gbdk is running on.
    
    This will report one of these three:
    * 60 Hz
    * 50 Hz
    * 50 Hz, Dendy-like (only applicable gbdk-nes port)
    
*/

#include <stdio.h>
#include <gbdk/platform.h>
#include <gbdk/font.h>
#include <gbdk/console.h>

const char* get_system_name(uint8_t system)
{
    switch(system)
    {
        case SYSTEM_60HZ:
            return "60 Hz";
        case SYSTEM_50HZ:
#if defined(NINTENDO_NES)
            // For gbdk-nes, we can also inspect the bits in _SYSTEM to more specifically
            // report the console as a Dendy-like Famiclone instead of an official PAL NES.
            // This distinction is rarely useful as both run on 50Hz, but can be a
            // useful feature for running this detection program on unknown hardware.
            if((_SYSTEM & 0xC0) == SYSTEM_BITS_DENDY)
                return "50 Hz (Dendy-like)";
            else
                return "50 Hz";
#else
            return "50 Hz";
#endif
        default:
            return "Unknown";
    }
}

void main(void)
{
    font_t ibm_font;
    uint8_t system = get_system();
    // Init font system and load font
    font_init();
    ibm_font = font_load(font_ibm);
    DISPLAY_ON;
    gotoxy(4, 4);
    printf("System: %s", get_system_name(system));
    vsync();
}
