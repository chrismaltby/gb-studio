/*
    fonts.c
    Simple example of how to use multiple fonts on the GB
    Michael Hope, 1999.
*/

#include <stdio.h>

#include <gbdk/platform.h>
#include <gbdk/font.h>

#include <gbdk/console.h>

#define WHITE 3 
#define DKGREY 1

void main(void)
{
#ifdef SEGA
    __WRITE_VDP_REG(VDP_R2, R2_MAP_0x3800);
    __WRITE_VDP_REG(VDP_R5, R5_SAT_0x3F00);
#endif

    font_t ibm_font, italic_font, min_font;
    int i;

    /* First, init the font system */
    font_init();

    /* Load all the fonts that we can */
    ibm_font = font_load(font_ibm);  /* 96 tiles */
    italic_font = font_load(font_italic);   /* 93 tiles */
    
    /* Load this one with dk grey background and white foreground */
    font_color(WHITE, DKGREY);
    
    min_font = font_load(font_min);

    /* Turn scrolling off (why not?) */
    mode(get_mode() | M_NO_SCROLL);

    /* Print some text! */
    
    /* IBM font */
    font_set(ibm_font);
    printf("Font demo.\n\n");

    printf("IBM Font #!?123\n");

    /* In italic */
    font_set(italic_font);
    for (i=1; i!=5; i++) {
	printf("In italics, line %u\n", i);
    }

    /* With a minimal, colour changed font */
    font_set(min_font);
    printf("Minimal 36 tile font\n");

    /* Done */
    font_set(ibm_font);
    printf("\nDone!");
}

    
    
