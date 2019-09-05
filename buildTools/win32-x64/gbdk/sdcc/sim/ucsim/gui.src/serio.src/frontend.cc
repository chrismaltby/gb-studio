/******************************************************************************
 * to emulate the serial input and output of an 8051 controller               *
 * frontend.cc - the ncurses frontend                                         *
 ******************************************************************************/
#include <sys/types.h>
#include <iostream.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <curses.h>
#include <errno.h>
#include <string.h>
#include <unistd.h>
#include "frontend.hh"

Viewer::Viewer()
{
	/* initalise the output screen */
	initscr();
	cbreak();
	noecho();
	nl();
	intrflush(stdscr,FALSE);
	keypad(stdscr, TRUE);
	
	/* clear the screen and off you go */
	refresh();

	// get the coordinates for the box
	/* create the subwindow */
	win_c.min_x = win_c.min_y = 0;
	getmaxyx(stdscr, win_c.max_y, win_c.max_x);

	/* define the boxed size */
	topleft.x = win_c.min_x + 1;
	bottomright.x = win_c.max_x - 2;
	topleft.y = win_c.min_y + 1;
	bottomright.y = win_c.max_y - 2;
	middle_y = (int)((bottomright.y-topleft.y)/2)+1;
	middle_x = (int)((bottomright.x-topleft.x)/2)+1;

	// draw the two subwindows
	inp_c.min_x = outp_c.min_x = topleft.x;
	inp_c.max_x = outp_c.max_x = bottomright.x;
	inp_c.min_y = topleft.y;
	inp_c.max_y = middle_y-topleft.y;
	outp_c.min_y = middle_y+1;
	outp_c.max_y = bottomright.y-middle_y;
	inp = subwin(stdscr, inp_c.max_y, inp_c.max_x, inp_c.min_y, inp_c.min_x);
	outp = subwin(stdscr, outp_c.max_y, outp_c.max_x, outp_c.min_y,outp_c.min_x);

	// initalise the windows
	touchwin(inp);
	werase(inp);
	wrefresh(inp);
	scrollok(inp, TRUE);

	touchwin(outp);
	werase(outp);
	wrefresh(outp);
	scrollok(outp, TRUE);
	refresh();

	nodelay(inp, TRUE);

	// flush the input buffers
	flushinp();
	
	move(topleft.x,topleft.y);
	DrawBox();
}

Viewer::~Viewer()
{
	delwin(inp);
	delwin(outp);
	erase();
	refresh();
	endwin();
}

void Viewer::DrawBox(void)
{
	int height, width;
	COORDINATES current;

	// save the current position
	getyx(stdscr, current.y, current.x);

	height = (bottomright.y - topleft.y)+1;
	width = (bottomright.x - topleft.y)+1;

	mvaddch(topleft.y-1, topleft.x-1, ACS_ULCORNER);
	mvaddch(topleft.y-1, bottomright.x+1, ACS_URCORNER);
	mvaddch(bottomright.y+1, bottomright.x+1, ACS_LRCORNER);
	mvaddch(bottomright.y+1, topleft.x-1, ACS_LLCORNER);

	/* wmove (screen, y, x) */
	/* top */
	move(topleft.y-1, topleft.x);
	hline(ACS_HLINE, width);
	/* bottom */
	move(bottomright.y+1, topleft.x);
	hline(ACS_HLINE, width);
	move(bottomright.y+1, topleft.x);
	hline(ACS_HLINE, width);
	
	/* left */
	move(topleft.y, topleft.x-1);
	vline(ACS_VLINE, height);

	/* right */
	move(topleft.y, bottomright.x+1);
	vline(ACS_VLINE, height);

	/* the divider */
	mvaddch(middle_y, bottomright.x+1, ACS_RTEE);
	mvaddch(middle_y, topleft.x-1, ACS_LTEE);
	hline(ACS_HLINE, width);

	// the window titles
	mvaddstr(inp_c.min_y-1, middle_x-(strlen("Input")/2), "Input");
	mvaddstr(middle_y, middle_x-(strlen("Output")/2), "Output");
	move(current.y, current.x);
	refresh();
}

void Viewer::AddStrOutWin(char *string)
{
	waddstr(outp, string);
	wrefresh(outp);
}

void Viewer::GetStrInWin(char *string)
{
	if(wgetstr(inp, string) == ERR) {
		string[0] = 0;
	} else {
		waddstr(inp, string);
		wrefresh(inp);
	}
}

void Viewer::AddChOutWin(char b)
{
	waddch(outp, b);
	wrefresh(outp);
}

char Viewer::GetChInWin(void)
{
	int b = wgetch(inp);

	if(b==ERR) {
		b=0;
	} else {
		waddch(inp, (chtype)b);
		wrefresh(inp);
	}

	return((char)b);
}
