/********************************************************************
 * Color Deep Scan                                                  *
 *  by                                                              *
 * Mr. N.U. of TeamKNOx                                             *
 ********************************************************************/

#include <gb/gb.h>
#include <stdlib.h>
#include <rand.h>

/* bitmaps */
#include "bkg.h"
#include "bkg.c"
#include "bkg_m.c"
#include "bkg_c.c"
#include "fore.h"
#include "fore.c"

/* ************************************************************ */

const UWORD bkg_p[] =
{
  bkgCGBPal0c0,bkgCGBPal0c1,bkgCGBPal0c2,bkgCGBPal0c3,
  bkgCGBPal1c0,bkgCGBPal1c1,bkgCGBPal1c2,bkgCGBPal1c3,
  bkgCGBPal2c0,bkgCGBPal2c1,bkgCGBPal2c2,bkgCGBPal2c3,
  bkgCGBPal3c0,bkgCGBPal3c1,bkgCGBPal3c2,bkgCGBPal3c3,
  bkgCGBPal4c0,bkgCGBPal4c1,bkgCGBPal4c2,bkgCGBPal4c3,
  bkgCGBPal5c0,bkgCGBPal5c1,bkgCGBPal5c2,bkgCGBPal5c3,
  bkgCGBPal6c0,bkgCGBPal6c1,bkgCGBPal6c2,bkgCGBPal6c3,
  bkgCGBPal7c0,bkgCGBPal7c1,bkgCGBPal7c2,bkgCGBPal7c3
};

const UWORD obj_p[] =
{
  foreCGBPal0c0,foreCGBPal0c1,foreCGBPal0c2,foreCGBPal0c3,
  foreCGBPal1c0,foreCGBPal1c1,foreCGBPal1c2,foreCGBPal1c3,
  foreCGBPal2c0,foreCGBPal2c1,foreCGBPal2c2,foreCGBPal2c3,
  foreCGBPal3c0,foreCGBPal3c1,foreCGBPal3c2,foreCGBPal3c3,
  foreCGBPal4c0,foreCGBPal4c1,foreCGBPal4c2,foreCGBPal4c3,
  foreCGBPal5c0,foreCGBPal5c1,foreCGBPal5c2,foreCGBPal5c3,
  foreCGBPal6c0,foreCGBPal6c1,foreCGBPal6c2,foreCGBPal6c3,
  foreCGBPal7c0,foreCGBPal7c1,foreCGBPal7c2,foreCGBPal7c3
};

/* screen size */
#define MIN_SX		5U		/* min x (char) */
#define MAX_SX		(20U-MIN_SX)    /* max x (char) */
#define MIN_SY		5U		/* min y (char) */
#define MAX_SY		(MIN_SY+13U)	/* max y (char) */

#define DEF_SP		30U		/* sprite null char code */	

/* player */
#define MIN_PX		(MIN_SX*8U+8U)	/* min x (dot) */
#define MAX_PX		(MAX_SX*8U-8U)	/* max x (dot) */
#define DEF_PX		80U		/* ship x pos (dot) */
#define DEF_PY		(MIN_SY*8U)	/* ship y pos (dot) */
#define DEF_PC0		14U
#define DEF_PC1		15U
#define DEF_PF		8U

/* bomb */
#define MAX_TT		6U		/* number */
#define DEF_TS		2U		/* sprite tile id */
#define DEF_TC		2U		/* sprite data id */
#define DEF_TX		(80U-6U)	/* bomb x pos (dot) */
#define DEF_TY		(DEF_PY-14U)	/* bomb y pos (dot) */
#define MAX_TY		(MAX_SY*8U)	/* max y pos (dot) */

/* enemy */
#define MAX_ET		10U		/* number */
#define DEF_ES0		(DEF_TS+MAX_TT) /* sprite tile id */
#define DEF_ES1		(DEF_ES0+1U)
#define DEF_1EC0	32U
#define DEF_1EC1	48U
#define DEF_2EC0	64U
#define DEF_2EC1	80U
#define DEF_XEC0	96U		/* sprite data(X) id */
#define DEF_XEC1	112U		/* sprite data(X) id */
#define DEF_EY		(DEF_PY+12U)
#define DEF_EH		10U
#define SUB_EX0		20U
#define SUB_EX1		(SUB_EX0-8U)
#define MIN_EX		(SUB_EX0-16U)
#define MAX_EX		(SUB_EX0+180U)
#define SPEED_EY	(DEF_EY+DEF_EH*3U)
#define DEF_BC1		4U
#define DEF_BC2		5U

/* kirai */
#define MAX_KT		12U
#define DEF_KS		(DEF_ES0+MAX_ET*2U)	/* sprite tile id */
#define DEF_KC		4U		/* sprite data id */
#define DEF_KX		0U		/* bomb x pos (default_dot) */
#define DEF_KY		0U		/* bomb y pos (default_dot) */
#define MIN_KY		(DEF_PY+1U)	/* min y pos (dot) */

unsigned char msg_tile[64];

const unsigned char * const msg_1up   = "1UP";
const unsigned char * const msg_lv    = "LV";

const unsigned char * const msg_gover = "GAMEOVER";
const unsigned char * const msg_pause = " PAUSE! ";
const unsigned char * const msg_start = "        ";

UBYTE pf, px, pp, pl;
UWORD pw;
UWORD ps;
UBYTE tf[MAX_TT];
UBYTE tx[MAX_TT], ty[MAX_TT];
UBYTE ef[MAX_ET], ex[MAX_ET], ey[MAX_ET];
UBYTE kf[MAX_KT], kx[MAX_KT], ky[MAX_KT];
UBYTE rnd_enemy, rnd_kirai;
UBYTE k_right, k_left;

void set_sprite_attrb( UBYTE nb, UBYTE tile )
{
  if( _cpu==CGB_TYPE ) {
    set_sprite_prop( nb, tile );
  }
}


void set_bkg_attr( UBYTE x, UBYTE y, UBYTE sx, UBYTE sy, unsigned char *d )
{
  UBYTE xx, yy;

  VBK_REG = 1;		/* select palette bank */
  for( yy=0; yy<sy; yy++ ) {
    for( xx=0; xx<sx; xx++ ) {
      msg_tile[xx] = bkgCGB[(unsigned int)*d];
      d++;
    }
    set_bkg_tiles( x, y+yy, sx, 1, msg_tile );
  }
  VBK_REG = 0;		/* select data bank */
}

UBYTE make_rnd( UBYTE i )
{
  return( arand()%(i+1) );
}

void show_score( UWORD s )
{
  UWORD m;
  UBYTE i, n, f;
  unsigned char score[6];

  f = 0; m = 10000;
  for( i=0; i<5; i++ ) {
    n = s/m; s = s%m; m = m/10;
    if( (n==0)&&(f==0) ) {
      score[i] = 0x20;      /* ' ' */
    } else {
      f = 1;
      score[i] = 0x30+n;    /* '0' - '9' */
    }
  }
  score[5] = 0x30;      /* '0' */
  set_bkg_tiles( 4, 0, 6, 1, score );
}

void set_level( UBYTE i )
{
  /* level */
  if( i < 9 ) {
    rnd_enemy = 100-(i*12); /*  1% - */
    rnd_kirai = 50-(i*6);   /*  2% - */
  } else {
    rnd_enemy = 0;      /* 100 % */
    rnd_kirai = 0;      /* 100 % */
  }
}

void show_level( UBYTE i )
{
  unsigned char level[2];

  if( i < 9 ) {
    level[0] = 0x31+i;
  } else {
    level[0] = 0x41+i-9;
  }
  set_bkg_tiles( 19, 0, 1, 1, level );
  set_level( i );
}

void show_gover()
{
  set_bkg_tiles(  6, 9, 8, 1, msg_gover );
  pf = DEF_PF;
}

void show_pause()
{
  set_bkg_tiles(  6, 9, 8, 1, msg_pause );
}

void hide_msg()
{
  set_bkg_tiles(  6, 9, 8, 1, msg_start );
}

void init_score()
{
  ps = 0;
  show_score( ps );
  pp = 0; pl = 0;
  show_level( pl );
}

void init_screen()
{
  UBYTE n;

  if( _cpu==CGB_TYPE ) {
    /* Transfer color palette */
    set_bkg_palette( 0, 1, &bkg_p[0] );
    set_bkg_palette( 1, 1, &bkg_p[4] );
    set_bkg_palette( 2, 1, &bkg_p[8] );
    set_bkg_palette( 3, 1, &bkg_p[12] );
    set_bkg_palette( 4, 1, &bkg_p[16] );
    set_bkg_palette( 5, 1, &bkg_p[20] );
    set_bkg_palette( 6, 1, &bkg_p[24] );
    set_bkg_palette( 7, 1, &bkg_p[28] );
    set_sprite_palette( 0, 1, &obj_p[0] );
    set_sprite_palette( 1, 1, &obj_p[4] );
    set_sprite_palette( 2, 1, &obj_p[8] );
    set_sprite_palette( 3, 1, &obj_p[12] );
    set_sprite_palette( 4, 1, &obj_p[16] );
    set_sprite_palette( 5, 1, &obj_p[20] );
    set_sprite_palette( 6, 1, &obj_p[24] );
    set_sprite_palette( 7, 1, &obj_p[28] );

    /* set attributes */
    set_bkg_attr( 0, 0, 20, 18, bkg_c );
    set_bkg_tiles(  0, 0, 20, 18, bkg_c );
  } else {
    set_bkg_tiles(  0, 0, 20, 18, bkg_m );
  }

  pw = 50;
  set_bkg_data(  0, 96, bkg );
  set_bkg_tiles(  0, 0, 3, 1, msg_1up );
  set_bkg_tiles( 16, 0, 2, 1, msg_lv );
  SHOW_BKG;
  SPRITES_8x8;
  set_sprite_data( 0, 128, fore );
  SHOW_SPRITES;
  for( n=0; n<40; n++ ) {
    set_sprite_tile( n, DEF_SP );
    move_sprite( n, 0, 0 );
  }
}

void init_player()
{
  pf = 0; px = DEF_PX;
  set_sprite_tile( 0, 0 );
  set_sprite_attrb( 0, foreCGB[0] );
  move_sprite( 0, px, DEF_PY );
  set_sprite_tile( 1, 1 );
  set_sprite_attrb( 1, foreCGB[1] );
  move_sprite( 1, px+8, DEF_PY );
}

void init_tama()
{
  UBYTE i;

  for( i=0; i<MAX_TT; i++ ) {
    tf[i] = 0;
    tx[i] = i*4+DEF_TX;
    ty[i] = DEF_TY;
    set_sprite_tile( i+DEF_TS, tf[i]+DEF_TC );
    set_sprite_attrb( i+DEF_TS, foreCGB[tf[i]+DEF_TC] );
    move_sprite( i+DEF_TS, tx[i], ty[i] );
  }
}

void init_enemy()
{
  UBYTE i;

  for( i=0; i<MAX_ET; i++ ) {
    ef[i] = 0;
    ex[i] = 0;
    ey[i] = 0;
    set_sprite_tile( i*2+DEF_ES0, DEF_SP );
    set_sprite_tile( i*2+DEF_ES1, DEF_SP );
    move_sprite( i*2+DEF_ES0, ex[i], ey[i] );
    move_sprite( i*2+DEF_ES1, ex[i], ey[i] );
  }
}

void init_kirai()
{
  UBYTE i;

  for( i=0; i<MAX_KT; i++ ) {
    kf[i] = 0;
    kx[i] = DEF_KX;
    ky[i] = DEF_KY;
    set_sprite_tile( i+DEF_KS, DEF_SP );
    move_sprite( i+DEF_KS, kx[i], ky[i] );
  }
}

/* player */
void player()
{
  UBYTE key;
  UBYTE i;
  UINT16 seed;

  key = joypad();
  /* pause */
  if( key & J_START ) {
    if( pf == DEF_PF ) {
      /* Initialize the random number generator */
      seed = DIV_REG;
      waitpadup();
      seed |= ((UINT16)DIV_REG << 8);
      initarand(seed);
      hide_msg();
      init_score();
      init_player();
      init_tama();
      init_enemy();
      init_kirai();
      delay( 500 );
    } else {
      show_pause();
      waitpadup();
      key = joypad();
      while( !(key & J_START) ) {
        key = joypad();
        if( key & J_DOWN ) {
          if(pl > 0)
            pl--;
          show_level( pl );
          waitpadup();
        } else if( key & J_UP ) {
          if(pl < 8)
            pl++;
          show_level( pl );
          waitpadup();
        } else if( key & J_LEFT ) {
          while( joypad() & J_LEFT ) {
            if(pw > 0)
              pw--;
            show_score( pw );
            delay( 250 );
          }
          show_score( ps );
        } else if( key & J_RIGHT ) {
          while( joypad() & J_RIGHT ) {
            if(pw < 99)
              pw++;
            show_score( pw );
            delay( 250 );
          }
          show_score( ps );
        } else if( key & J_SELECT ) {
          i = k_right;
          k_right = k_left;
          k_left  = i;
          waitpadup();
        }
      }
      waitpadup();
      hide_msg();
      delay( 500 );
    }
    return;
  }

  /* dead */
  if( pf > 1 ) {
    if( pf < DEF_PF ) {
      set_sprite_tile( 0, pf*2+DEF_PC0 );
      set_sprite_attrb( 0, foreCGB[pf*2+DEF_PC0] );
      set_sprite_tile( 1, pf*2+DEF_PC1 );
      set_sprite_attrb( 1, foreCGB[pf*2+DEF_PC1] );
      pf++;
    } else {
      set_sprite_tile( 0, DEF_SP );
      set_sprite_tile( 1, DEF_SP );
      show_gover();
    }
    return;
  }

  /* move */
  if( (key&J_LEFT)&&(px>MIN_PX) ) {
    px--;
    move_sprite( 0, px, DEF_PY ); move_sprite( 1, px+8, DEF_PY );
  } else if( (key&J_RIGHT)&&(px<MAX_PX) ) {
    px++;
    move_sprite( 0, px, DEF_PY ); move_sprite( 1, px+8, DEF_PY );
  }
  /* shot */
  if( key & k_left ) {  /* change J_B to J_A */
    if( pf == 0 ) {
      pf = 1;
      for( i=0; i<MAX_TT; i++ ) {
        if( tf[i] == 0 ) {
          tf[i] = 1; tx[i] = px-4; ty[i] = DEF_PY;
          break;
        }
      }
    }
  } else if( key & k_right ) {  /* change J_A to J_B */
    if( pf == 0 ) {
      pf = 1;
      for( i=0; i<MAX_TT; i++ ) {
        if( tf[i] == 0 ) {
          tf[i] = 1; tx[i] = px+12; ty[i] = DEF_PY;
          break;
        }
      }
    }
  } else if( pf == 1 ) {
    pf = 0;
  }
}

/* bombs */
void bombs()
{
   volatile UBYTE i;

   for( i=0; i<MAX_TT; i++ ) {
    if( tf[i] != 0 ) {
      ty[i]++;
      if( ty[i] > MAX_TY ) {
        tf[i] = 0; tx[i] = i*4+DEF_TX; ty[i] = DEF_TY;
      } else {
        tf[i] = 3-tf[i];
      }
      set_sprite_tile( i+DEF_TS, tf[i]+DEF_TC );
      set_sprite_attrb( i+DEF_TS, foreCGB[tf[i]+DEF_TC] );
      move_sprite( i+DEF_TS, tx[i], ty[i] );
    }
  }
}

/* enemys */
void enemys()
{
  UBYTE i, j;

  for( i=0; i<MAX_ET; i++ ) {
    if( ef[i] == 1 ) {
      /* move right to left */
      ex[i]--;
      if( (pl>0)&&(ey[i]<SPEED_EY) )  ex[i]--;
      if( ex[i] <= MIN_EX ) {
        ef[i] = 0;
        set_sprite_tile( i*2+DEF_ES0, DEF_SP );
        set_sprite_tile( i*2+DEF_ES1, DEF_SP );
      } else {
        /* new */
        if( ex[i]<MIN_SX*8+13 ) {
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0 );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1 );
        } else if( ex[i]<MIN_SX*8+20 ) {
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0 );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1+(ex[i]-MIN_SX*8-13) );
        } else if( ex[i]<MIN_SX*8+28 ) {
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0+(ex[i]-MIN_SX*8-20) );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1+8 );
        } else if( ex[i]<MAX_SX*8+13 ) {
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0+8 );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1+8 );
        } else if( ex[i]<MAX_SX*8+20 ) {
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0+8 );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1+(ex[i]-MAX_SX*8-12)+7 );
        } else if( ex[i]<MAX_SX*8+28 ) {
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0+(ex[i]-MAX_SX*8-20)+8 );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1 );
        } else {
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0 );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1 );
        }
        /* new */
        move_sprite( i*2+DEF_ES0, ex[i]-SUB_EX0, ey[i] );
        move_sprite( i*2+DEF_ES1, ex[i]-SUB_EX1, ey[i] );
        /* check bomb */
        for( j=0; j<MAX_TT; j++ ) {
          if( tf[j] != 0 ) {
            if( (ty[j]>ey[i]-2)&&(ty[j]<ey[i]+2) ) {
              if( (tx[j]>(ex[i]-SUB_EX0-5))&&(tx[j]<(ex[i]-SUB_EX1+5)) ) {
                /* hit */
                tf[j] = 0; tx[j] = j*4+DEF_TX; ty[j] = DEF_TY;
                set_sprite_tile( j+DEF_TS, tf[j]+DEF_TC );
                set_sprite_attrb( j+DEF_TS, foreCGB[tf[j]+DEF_TC] );
                move_sprite( j+DEF_TS, tx[j], ty[j] );
                ef[i] = 3;
                set_sprite_tile( i*2+DEF_ES0, ef[i]*2+DEF_BC1 );
                set_sprite_attrb( i*2+DEF_ES0, foreCGB[ef[i]*2+DEF_BC1] );
                set_sprite_tile( i*2+DEF_ES1, ef[i]*2+DEF_BC2 );
                set_sprite_attrb( i*2+DEF_ES1, foreCGB[ef[i]*2+DEF_BC2] );
              }
            }
          }
        }
        if( make_rnd(rnd_kirai) == 0 ) {
          if( ((ex[i]-SUB_EX0)>MIN_PX)&&((ex[i]-SUB_EX0)<MAX_PX) ) {
            if( kf[i] == 0 ) {
              /* shot kirai */
              kf[i] = 1;
              kx[i] = ex[i]-SUB_EX0+4;
              ky[i] = ey[i]-4;
            } else if( kf[i+1] == 0 ) {
              /* shot kirai */
              kf[i+1] = 1;
              kx[i+1] = ex[i]-SUB_EX0+4;
              ky[i+1] = ey[i]-4;
            } else if( kf[i+2] == 0 ) {
              /* shot kirai */
              kf[i+2] = 1;
              kx[i+2] = ex[i]-SUB_EX0+4;
              ky[i+2] = ey[i]-4;
            }
          }
        }
      }
    } else if( ef[i] == 2 ) {
      /* move left to right */
      ex[i]++;
      if( (pl>0)&&(ey[i]<SPEED_EY) )  ex[i]++;
      if( ex[i] >= MAX_EX ) {
        ef[i] = 0;
        set_sprite_tile( i*2+DEF_ES0, DEF_SP );
        set_sprite_tile( i*2+DEF_ES1, DEF_SP );
      } else {
        /* new */
        if( i==9 ) {
          if( ex[i]<MIN_SX*8+13 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_XEC0 );
            set_sprite_tile( i*2+DEF_ES1, DEF_XEC1 );
          } else if( ex[i]<MIN_SX*8+20 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_XEC0 );
            set_sprite_tile( i*2+DEF_ES1, DEF_XEC1+(ex[i]-MIN_SX*8-13) );
          } else if( ex[i]<MIN_SX*8+28 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_XEC0+(ex[i]-MIN_SX*8-20) );
            set_sprite_tile( i*2+DEF_ES1, DEF_XEC1+8 );
          } else if( ex[i]<MAX_SX*8+13 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_XEC0+8 );
            set_sprite_tile( i*2+DEF_ES1, DEF_XEC1+8 );
          } else if( ex[i]<MAX_SX*8+20 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_XEC0+8 );
            set_sprite_tile( i*2+DEF_ES1, DEF_XEC1+(ex[i]-MAX_SX*8-12)+7 );
          } else if( ex[i]<MAX_SX*8+28 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_XEC0+(ex[i]-MAX_SX*8-20)+8 );
            set_sprite_tile( i*2+DEF_ES1, DEF_XEC1 );
          } else {
            set_sprite_tile( i*2+DEF_ES0, DEF_XEC0 );
            set_sprite_tile( i*2+DEF_ES1, DEF_XEC1 );
          }
        } else {
          if( ex[i]<MIN_SX*8+13 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_2EC0 );
            set_sprite_tile( i*2+DEF_ES1, DEF_2EC1 );
          } else if( ex[i]<MIN_SX*8+20 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_2EC0 );
            set_sprite_tile( i*2+DEF_ES1, DEF_2EC1+(ex[i]-MIN_SX*8-13) );
          } else if( ex[i]<MIN_SX*8+28 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_2EC0+(ex[i]-MIN_SX*8-20) );
            set_sprite_tile( i*2+DEF_ES1, DEF_2EC1+8 );
          } else if( ex[i]<MAX_SX*8+13 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_2EC0+8 );
            set_sprite_tile( i*2+DEF_ES1, DEF_2EC1+8 );
          } else if( ex[i]<MAX_SX*8+20 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_2EC0+8 );
            set_sprite_tile( i*2+DEF_ES1, DEF_2EC1+(ex[i]-MAX_SX*8-12)+7 );
          } else if( ex[i]<MAX_SX*8+28 ) {
            set_sprite_tile( i*2+DEF_ES0, DEF_2EC0+(ex[i]-MAX_SX*8-20)+8 );
            set_sprite_tile( i*2+DEF_ES1, DEF_2EC1 );
          } else {
            set_sprite_tile( i*2+DEF_ES0, DEF_2EC0 );
            set_sprite_tile( i*2+DEF_ES1, DEF_2EC1 );
          }
        }
        /* new */
        move_sprite( i*2+DEF_ES0, ex[i]-SUB_EX0, ey[i] );
        move_sprite( i*2+DEF_ES1, ex[i]-SUB_EX1, ey[i] );
        /* check bomb */
        for( j=0; j<MAX_TT; j++ ) {
          if( tf[j] != 0 ) {
            if( (ty[j]>ey[i]-2)&&(ty[j]<ey[i]+2) ) {
              if( (tx[j]>(ex[i]-SUB_EX0-5))&&(tx[j]<(ex[i]-SUB_EX1+5)) ) {
                /* hit */
                tf[j] = 0; tx[j] = j*4+DEF_TX; ty[j] = DEF_TY;
                set_sprite_tile( j+DEF_TS, tf[j]+DEF_TC );
                set_sprite_attrb( j+DEF_TS, foreCGB[tf[j]+DEF_TC] );
                move_sprite( j+DEF_TS, tx[j], ty[j] );
                ef[i] = 3;
                set_sprite_tile( i*2+DEF_ES0, ef[i]*2+DEF_BC1 );
                set_sprite_attrb( i*2+DEF_ES0, foreCGB[ef[i]*2+DEF_BC1] );
                set_sprite_tile( i*2+DEF_ES1, ef[i]*2+DEF_BC2 );
                set_sprite_attrb( i*2+DEF_ES1, foreCGB[ef[i]*2+DEF_BC2] );
              }
            }
          }
        }
        if( make_rnd(rnd_kirai) == 0 ) {
          if( ((ex[i]-SUB_EX0)>MIN_PX)&&((ex[i]-SUB_EX0)<MAX_PX) ) {
            if( kf[i] == 0 ) {
              /* shot kirai */
              kf[i] = 1;
              kx[i] = ex[i]-SUB_EX0+4;
              ky[i] = ey[i]-4;
            } else if( kf[i+1] == 0 ) {
              /* shot kirai */
              kf[i+1] = 1;
              kx[i+1] = ex[i]-SUB_EX0+4;
              ky[i+1] = ey[i]-4;
            } else if( kf[i+2] == 0 ) {
              /* shot kirai */
              kf[i+2] = 1;
              kx[i+2] = ex[i]-SUB_EX0+4;
              ky[i+2] = ey[i]-4;
            }
          }
        }
      }
    } else if( ef[i] >= 3 ) {
      if( ef[i] > 4 ) {
        ef[i] = 0;
        set_sprite_tile( i*2+DEF_ES0, DEF_SP );
        set_sprite_tile( i*2+DEF_ES1, DEF_SP );
        if( i == 9 ) {
          ps += 100; show_score( ps ); pp++;
          set_level( pl-1 );
        } else {
          ps += (i+1); show_score( ps ); pp++;
        }
      } else {
        set_sprite_tile( i*2+DEF_ES0, ef[i]*2+DEF_BC1 );
        set_sprite_attrb( i*2+DEF_ES0, foreCGB[ef[i]*2+DEF_BC1] );
        set_sprite_tile( i*2+DEF_ES1, ef[i]*2+DEF_BC2 );
        set_sprite_attrb( i*2+DEF_ES1, foreCGB[ef[i]*2+DEF_BC2] );
        ef[i]++;
      }
    } else if( i == 9 ) {
      if( pp > 20 ) {
        pp = 0;
        pl++; show_level( pl );
        /* X */
        ey[i] = i*DEF_EH+DEF_EY;
        ef[i] = i%2+1;
        ex[i] = MIN_EX;
        set_sprite_tile( i*2+DEF_ES0, DEF_XEC0 );
        set_sprite_attrb( i*2+DEF_ES0, foreCGB[DEF_XEC0] );
        set_sprite_tile( i*2+DEF_ES1, DEF_XEC1 );
        set_sprite_attrb( i*2+DEF_ES1, foreCGB[DEF_XEC1] );
        move_sprite( i*2+DEF_ES0, ex[i]-SUB_EX0, ey[i] );
        move_sprite( i*2+DEF_ES1, ex[i]-SUB_EX1, ey[i] );
      }
    } else if( make_rnd(rnd_enemy) == 0 ) {
      if( !((pl<4)&&(i==0)) ) {
        /* create */
        ey[i] = i*DEF_EH+DEF_EY;
        ef[i] = i%2+1;
        if( ef[i] == 1 ) {
          ex[i] = MAX_EX;
          set_sprite_tile( i*2+DEF_ES0, DEF_1EC0 );
          set_sprite_attrb( i*2+DEF_ES0, foreCGB[DEF_1EC0] );
          set_sprite_tile( i*2+DEF_ES1, DEF_1EC1 );
          set_sprite_attrb( i*2+DEF_ES1, foreCGB[DEF_1EC1] );
        } else {
          ex[i] = MIN_EX;
          set_sprite_tile( i*2+DEF_ES0, DEF_2EC0 );
          set_sprite_attrb( i*2+DEF_ES0, foreCGB[DEF_2EC0] );
          set_sprite_tile( i*2+DEF_ES1, DEF_2EC1 );
          set_sprite_attrb( i*2+DEF_ES1, foreCGB[DEF_2EC1] );
        }
        move_sprite( i*2+DEF_ES0, ex[i]-SUB_EX0, ey[i] );
        move_sprite( i*2+DEF_ES1, ex[i]-SUB_EX1, ey[i] );
      }
    }
  }
}

/* kirai */
void kirai()
{
  UBYTE i;

  for( i=0; i<MAX_KT; i++ ) {
    if( kf[i] != 0 ) {
      ky[i]--;
      if( kf[i] >=3 ) {
        kf[i]++;
        if( (kx[i]>(px-5))&&(kx[i]<(px+12)) ) {
          if( pf < 2 ) {
            /* out!! */
            pf = 2;
          }
        }
        if( kf[i] >= 6 ) {
          kf[i] = 0; kx[i] = DEF_KX; ky[i] = DEF_KY;
        }
      } else if( ky[i] <= MIN_KY ) {
        kf[i] = 3;
      } else {
        kf[i] = 3-kf[i];
      }
      set_sprite_tile( i+DEF_KS, kf[i]+DEF_KC );
      set_sprite_attrb( i+DEF_KS, foreCGB[kf[i]+DEF_KC] );
      move_sprite( i+DEF_KS, kx[i], ky[i] );
    }
  }
}

/*--------------------------------------------------------------------------*
 | main program                                                             |
 *--------------------------------------------------------------------------*/
void main()
{
  disable_interrupts();
  DISPLAY_OFF;

  init_screen();
  init_score();
  init_player();
  init_tama();
  init_enemy();
  init_kirai();
  show_gover();
  k_right = J_A;
  k_left = J_B;
  DISPLAY_ON;
  enable_interrupts();

  while(1) {
    delay( pw );
    player();
    bombs();
    enemys();
    kirai();
  }
}
