#include <gb/gb.h>
#include <gb/cgb.h>
#include <stdint.h>

#include "bar_c.h"
#include "bar_c.c"
#include "bar_m.c"

const uint16_t bar_p[] =
{
  bar_cCGBPal0c0,bar_cCGBPal0c1,bar_cCGBPal0c2,bar_cCGBPal0c3,
  bar_cCGBPal1c0,bar_cCGBPal1c1,bar_cCGBPal1c2,bar_cCGBPal1c3,
  bar_cCGBPal2c0,bar_cCGBPal2c1,bar_cCGBPal2c2,bar_cCGBPal2c3,
  bar_cCGBPal3c0,bar_cCGBPal3c1,bar_cCGBPal3c2,bar_cCGBPal3c3,
  bar_cCGBPal4c0,bar_cCGBPal4c1,bar_cCGBPal4c2,bar_cCGBPal4c3,
  bar_cCGBPal5c0,bar_cCGBPal5c1,bar_cCGBPal5c2,bar_cCGBPal5c3,
  bar_cCGBPal6c0,bar_cCGBPal6c1,bar_cCGBPal6c2,bar_cCGBPal6c3,
  bar_cCGBPal7c0,bar_cCGBPal7c1,bar_cCGBPal7c2,bar_cCGBPal7c3
};

const unsigned char bar_a[] =
{
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  7,7,4,4,4,6,6,6,2,2,2,5,5,5,1,1,1,3,3,3,
  3,3,0,0,0,5,5,5,0,0,0,6,6,6,0,0,0,7,7,7,
  3,3,3,3,0,0,0,0,5,5,5,5,0,0,0,0,0,0,0,0,
  3,3,3,3,0,0,0,0,5,5,5,5,0,0,0,0,0,0,0,0,
  3,3,3,3,0,0,0,0,5,5,5,5,0,0,0,0,0,0,0,0
};

int main(void)
{
  /* Transfer color palettes */
  set_bkg_palette( 7, 1, &bar_p[0] );
  set_bkg_palette( 6, 1, &bar_p[4] );
  set_bkg_palette( 5, 1, &bar_p[8] );
  set_bkg_palette( 4, 1, &bar_p[12] );
  set_bkg_palette( 3, 1, &bar_p[16] );
  set_bkg_palette( 2, 1, &bar_p[20] );
  set_bkg_palette( 1, 1, &bar_p[24] );
  set_bkg_palette( 0, 1, &bar_p[28] );

  /* CHR code transfer */
  set_bkg_data( 0x0, 32, bar_c );

  /* Select VRAM bank 1 */
  VBK_REG = 1;
  /* Set attributes */
  set_bkg_tiles( 0, 0, bar_mWidth, bar_mHeight, bar_a );

  /* Select VRAM bank 0 */
  VBK_REG = 0;
  /* Set data */
  set_bkg_tiles( 0, 0, bar_mWidth, bar_mHeight, bar_m );

  SHOW_BKG;
  enable_interrupts();
  DISPLAY_ON;

  return 0;
}
