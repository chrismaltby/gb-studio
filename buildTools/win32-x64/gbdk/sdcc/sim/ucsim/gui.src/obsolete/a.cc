#include <curses.h>
#include <panel.h>

int sfr[4];
int port[4];

void
init_panel(PANEL *p)
{
  int mask, x, y;
  int na, ha;
  int cursor= 2;
  WINDOW *w= panel_window(p);
  
  if (has_colors())
    {
      na= COLOR_PAIR(1);
      ha= COLOR_PAIR(2);
    }
  else
    {
      na= A_NORMAL;
      ha= A_STANDOUT;
    }
  //wattron(w, COLOR_PAIR);
  x= 0;
  for (mask= 1, y= 0; mask < 0x100; mask<<= 1,y++)
    {
      wattrset(w, (y==cursor)?ha:na);
      mvwprintw(w, y,x, "%s", (sfr[0]&mask)?"High":" Low");
    }
}

wchar_t
wait_input(PANEL *p)
{
  WINDOW *w= panel_window(p);
  wchar_t c;

  c= wgetch(w);
  printw("%d 0x%x\n",c,c);
  return(c);
}

int
main(int argc, char *argv[])
{
  wchar_t c;

  initscr();      /* initialize the curses library */
  keypad(stdscr, TRUE);  /* enable keyboard mapping */
  nonl();         /* tell curses not to do NL->CR/NL on output */
  cbreak();       /* take input chars one at a time, no wait for \n */
  noecho();       /* don't echo input */
  if (has_colors())
    {
      start_color();
      printw("has %d colors and %d pairs\n", COLORS, COLOR_PAIRS);
      init_pair(1, COLOR_WHITE, COLOR_BLUE);
      init_pair(2, COLOR_WHITE, COLOR_RED);
    }
  if (has_key(KEY_UP))
    printw("has UP KEY_UP=0x%x\n",KEY_UP);
  else
    printf("has no UP\n");
  c= getch();
  printw("got %d %x\n",c,c);

  WINDOW *w= newwin(10,10, 3,3);
  keypad(w, TRUE);
  PANEL *p= new_panel(w);

  sfr[0]= 0x5a;
  init_panel(p);
  update_panels();
  doupdate();
  c= wait_input(p);
  //c= getch();

  endwin();
  if (c==KEY_UP)
    printf("got UP\n");
  else if (c==KEY_DOWN)
    printf("got DOWN\n");
  else
    printf("got \"%d\"\n", c);
}
