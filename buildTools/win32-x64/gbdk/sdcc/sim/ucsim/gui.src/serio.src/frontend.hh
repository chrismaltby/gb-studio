/******************************************************************************
 * to emulate the serial input and output of an 8051 controller               *
 * frontend.hh - ncurses frontend                                             *
 ******************************************************************************/
#include <sys/types.h>
#include <curses.h>
#include "config.h"

struct COORDS_S
{
	int min_x;
	int max_x;
	int min_y;
	int max_y;
};
typedef struct COORDS_S COORDS;

struct COORDINATES_S
{
	int x;
	int y;
};
typedef struct COORDINATES_S COORDINATES;


class Viewer
{
	public:
		Viewer();
		~Viewer();
		void DrawBox(void);
		void AddStrOutWin(char *string);
		void GetStrInWin(char *string);
		void AddChOutWin(char b);
		char GetChInWin(void);

	private:
		WINDOW *inp, *outp;
		COORDS win_c, inp_c, outp_c;
		COORDINATES topleft, bottomright, current;
		int middle_y, middle_x;
};
