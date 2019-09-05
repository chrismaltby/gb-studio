/*@1@*/

#include "portcl.h"


/*
 * Viewer of the port
 */

cl_port::cl_port(class cl_box *ipos, int iid, char *iname, class cl_app *iapp):
  cl_view(ipos, iname, iapp)
{
  id= iid;
  sfr= 0;
  pin= 0;
  curs_x= curs_y= 0;
}

int
cl_port::draw(void)
{
  int x, y, mask, hc, nc;

  cl_view::draw();

  nc= hc= get_color(C_WIN_NORMAL);
  if (state & SF_SELECTED)
    hc= get_color(C_WIN_SELECTED);
  mvwprintw(window, 0,0, "SFR PORT PIN");
  for (x= 0, mask= 0x80, y= 1; mask; mask>>= 1,y++)
    {
      wattrset(window, (curs_x)?nc:(curs_y==y-1?hc:nc));
      mvwprintw(window, y,x, "  %c", (sfr&mask)?'1':'0');
    }
  wattrset(window, nc);
  for (x= 5, mask= 0x80, y= 1; mask; mask>>= 1,y++)
    mvwprintw(window, y,x, "%c", (sfr&pin&mask)?'1':'0');
  for (x=9, mask= 0x80, y= 1; mask; mask>>= 1,y++)
    {
      wattrset(window, curs_x?(curs_y==y-1?hc:nc):nc);
      mvwprintw(window, y,x, "%c  ", (pin&mask)?'1':'0');
    }
  wattrset(window, nc);
  mvwprintw(window, 9,0, "0x%02x    0x%02x", sfr, pin);
  mvwprintw(window, 10,4, "0x%02x", sfr&pin);
  app->drawn++;
  return(0);
}

int
cl_port::handle_event(struct t_event *event)
{
  if (event->what == EV_KEY)
    switch (event->event.key)
      {
      case KEY_HOME:
	curs_y= 0; draw(); return(1);
      case KEY_A1:
	curs_x= curs_y= 0; draw(); return(1);
      case KEY_A3:
	curs_y= 0; curs_x= 1; draw(); return(1);
      case KEY_C1:
	curs_x= 0; curs_y= 7; draw(); return(1);
      case KEY_C3:
	curs_x= 1; curs_y= 7; draw(); return(1);
      case KEY_LEFT: case KEY_RIGHT: case 'j': case 'k': case 'l': case 'r':
	if (curs_x)
	  curs_x= 0;
	else
	  curs_x= 1;
	draw();
	return(1);
      case KEY_UP: case 'u':
	curs_y--;
	if (curs_y < 0)
	  curs_y= 7;
	draw();
	return(1);
      case KEY_DOWN: case 'd':
	curs_y++;
	if (curs_y > 7)
	  curs_y= 0;
	draw();
	return(1);
      case ' ': case '\n': case '\r':
	if (curs_x)
	  toggle_pin(7-curs_y);
	else
	  toggle_sfr(7-curs_y);
	return(1);
      }
  return(cl_view::handle_event(event));
}

int
cl_port::toggle_sfr(int bitnr)
{
  int mask= 1<<bitnr;
  sfr^= mask;
  draw();
  return(0);
}

int
cl_port::toggle_pin(int bitnr)
{
  int mask= 1<<bitnr;
  pin^= mask;
  draw();
  return(0);
}

/*
 * Window to show port viewer
 ******************************************************************************
 */

cl_portw::cl_portw(class cl_box *ipos, int iid, char *ititle,
		   class cl_app *iapp):
  cl_win(ipos, ititle, iapp)
{
  id= iid;
}

class cl_view *
cl_portw::mk_intern(class cl_box *ipos)
{
  char n[100]= "";

  sprintf(n, "port%dviewer", id);
  class cl_view *v= new cl_port(ipos, id, n, app);
  v->init();
  return(v);
}

int
cl_portw::handle_event(struct t_event *event)
{
  return(cl_win::handle_event(event));
}


/* End of gui.src/portmap.src/port.cc */
