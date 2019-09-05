/* For some reason an integer operation is run as floating point.
   Test is to see if it links.
 */
#include <testfwk.h>

typedef unsigned char UBYTE;
typedef unsigned char UINT8;

void
set_sprite_tile(UINT8 nb, UINT8 tile)
{
  UNUSED(nb && tile);
}

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

UBYTE ef[MAX_ET], ex[MAX_ET], ey[MAX_ET];
UBYTE pf, px, pp, pl;

/* enemys */
void enemys()
{
  UBYTE i;

  for( i=0; i<MAX_ET; i++ ) {
    if( ef[i] == 1 ) {
      set_sprite_tile( i*2+DEF_ES0, DEF_1EC0+8 );
      set_sprite_tile( i*2+DEF_ES1, DEF_1EC1+(ex[i]-MAX_SX*8-12)+7 );
    }
  }
}
