/*-------------------------------------------------------------------------
  mh2h.c - megaheader to header conversion utility.  This utility converts
   the mega-header MCS51 mcs51reg.h file to multiple simple header files.

   We want the simple headers for compatibility with other compilers
   and also for documentation(quick reference of registers names and
   bit defines while programming).
   At the same time we don't want to maintain all these redundant files.

   So this offers a solution of converting 1 master .h file into many
   simple header files.

   We use the preprocessor(sdcpp) to do most of the work.  Then we
   use some c code to clean it up and make it look pretty.

   Usage# mh2h {include_dir {bin_dir}} ; no options used.
     default include_dir is "/usr/local/share/sdcc/include"
     default bin_dir(run sdcpp from is ""

   Written by Karl Bongers(kbongers@turbobit.com)
|-------------------------------------------------------------------------*/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void get_micro_h_name(char *name, char *ret_str);
void get_micro_list(void);
void strip_eol(char *str);
void strip_trailing_sp(char *str);

#define MAX_LISTSIZE 100
char *micro_list[MAX_LISTSIZE];
char bin_dir[256];
char inc_dir[256];

/*-------------------------------------------------------------------------
|-------------------------------------------------------------------------*/
int main(int argc, char *argv[])
{
  int stat;
  FILE *fpi, *fpo;
  char str[256];
  char fname[256];
  int mi;
  int last_line_was_sfr = 1;  // used to print pretty, add a blank line

  // 1st arg optional inc dir to pull mcs51reg.h from
  if (argc > 1) {
    strcpy(inc_dir, argv[1]);
    printf("using %s bin dir\n", inc_dir);
  }
  else {
    strcpy(inc_dir, "/usr/local/share/sdcc/include/");
  }

  // 2nd arg optional bin dir to run sdcpp from
  if (argc > 2) {
    strcpy(bin_dir, argv[2]);
    printf("using %s bin dir\n", bin_dir);
  }
  else {
    bin_dir[0] = 0;
  }


  get_micro_list();
  mi = 0;
  while (micro_list[mi] != NULL)
  {
    printf("LIST:%s\n", micro_list[mi++]);
  }

  mi = 0;
  while (micro_list[mi] != NULL)
  {
    printf("converting %s\n", micro_list[mi]);
    fflush(0);

    sprintf(str, "%ssdcpp -D%s %smcs51reg.h tmp1",
       bin_dir,
       micro_list[mi],
       inc_dir);

    stat = system(str);
    /* stat = -1, or 127 error */

    fpi = fopen("tmp1", "r");
    if (fpi == NULL) {
      printf("error opening file to read\n");
      exit(1);
    }

    get_micro_h_name(micro_list[mi], fname);
    //sprintf(fname, "tmp%d.h", mi+1);

    fpo = fopen(fname, "w");
    if (fpo == NULL) {
      printf("error opening %s  file to write\n", fname);
      exit(1);
    }

    fputs("/*-------------------------------------------------------------------------\n",
       fpo);
    fprintf(fpo, " %s - %s header file.\n", fname, micro_list[mi]);
    fputs(" This file was automatically generated using mh2h utility\n", fpo);
    fputs(" to convert from mcs51reg.h.\n", fpo);
    fputs("|-------------------------------------------------------------------------*/\n",
       fpo);
    fprintf(fpo, "#define %s\n", micro_list[mi]);
    fputs("#include <mcs51reg.h>\n\n", fpo);

    fprintf(fpo, "#if 0\n");
    fputs("The following is for your reference only\n", fpo);
    fputs("and is an accurate translation of what the\n", fpo);
    fputs("above included mcs51reg.h file generates.\n\n", fpo);
      
    while (fgets(str, 256, fpi) != NULL) {
      strip_eol(str);
      strip_trailing_sp(str);

      if (strlen(str) <= 0)
        continue;
      if (strncmp(str, "#line ", 6) == 0)
        continue;
      if (strncmp(str, "//", 2) == 0)
        continue;

      if (strncmp(str, "sfr ", 4) == 0)
      {
        if (!last_line_was_sfr)
          fputs("\n", fpo);  /* for readability, add a blank line) */
        last_line_was_sfr = 1;
      }
      else
      {
        if (strncmp(str, "sbit ", 5) == 0)
          fputs("  ", fpo);  /* for readability, indent */

        last_line_was_sfr = 0;
      }

      //printf("[%d,%s]\n", strlen(str), str);
      fputs(str, fpo);
      fputs("\n", fpo);
    }
    fprintf(fpo, "#endif\n");

    fclose(fpi);
    fclose(fpo);
    ++mi;
  }  // while micro_list[mi]

  return 0;
}

/*-------------------------------------------------------------------------
  get_micro_h_name - get a .h filename to output to.  Preferably, we will
    have this info in mcs51reg.h file(alias:8051.h) and not do it like this.
|-------------------------------------------------------------------------*/
void get_micro_h_name(char *name, char *ret_str)
{
  int mi;
static int name_i = 1;
  // note: pulling these from mcs51reg.h would be better...
static char *micro_strings[] = {
   "MICROCONTROLLER_8051", "8051.h",
   "MICROCONTROLLER_8052", "8052.h",
   "MICROCONTROLLER_AT89CX051", "at89x051.h",
   "MICROCONTROLLER_AT89S53",  "at89s53.h",
   "MICROCONTROLLER_AT89X52",  "at89x52.h",
   "MICROCONTROLLER_AT89X55",  "at89x55.h",
   "MICROCONTROLLER_DS5000",   "ds5000.h",
   "MICROCONTROLLER_DS5001",   "ds5001.h",
   "MICROCONTROLLER_DS80C32X", "ds80c32x.h",
   "MICROCONTROLLER_DS80C390", "ds80c390.h",
   "MICROCONTROLLER_DS89C420", "ds89c420.h",
   "MICROCONTROLLER_DS8XC520", "ds8xc520.h",
   "MICROCONTROLLER_SAB80515",  "sab80515.h",
   "MICROCONTROLLER_SAB80515A", "sab80515a.h",
   "MICROCONTROLLER_SAB80517",  "sab80517.h",
   "MICROCONTROLLER_P80C552",   "p80c552.h",
   NULL};

   *ret_str = 0;
   mi = 0;
   while (micro_strings[mi] != NULL)
   {
     if (strcmp(micro_strings[mi], name) == 0)
     {
       strcpy(ret_str, micro_strings[mi+1]);
     }
     mi += 2;
   }

   if (*ret_str == 0)
   {
     sprintf(ret_str, "noname%d.h", name_i++);
     printf("warning, could not find .h filename for %s using %s\n",
       name, ret_str);
   }
}

/*-------------------------------------------------------------------------
  get_micro_list - get the list of micros supported by mcs51reg.h, grab
    this list out of the mcs51reg.h file.
|-------------------------------------------------------------------------*/
void get_micro_list(void)
{
 FILE *fp;
 char str[256];
 int li = 0;
 char *s;
 char *s_start;

  strcpy(str, inc_dir);
  strcat(str, "mcs51reg.h");
  fp = fopen(str, "r");
  if (fp == NULL) {
    printf("error opening %s file to read\n", str);
    exit(1);
  }
  while (fgets(str, 256, fp) != NULL)
  {
    strip_eol(str);
    strip_trailing_sp(str);
    s = str;
    while (*s == ' ')
      ++s;
    if (strlen(s) <= 0)
      continue;

    if (strncmp(s, "MICROCONTROLLER_", 16) == 0)
    {
      s_start = s;
      while ((*s != 0) && (*s != ' '))
        ++s;
      *s = 0;
      micro_list[li++] = strdup(s_start); // add to our list MICROCONTROLLER_X
      if (li >= MAX_LISTSIZE)
        exit(1);
    }
  }  // while

  micro_list[li] = NULL;

  if (li == 0)
  {
    printf("Error, no MICROCONTROLLER_ defines found\n");
    exit(1);
  }
  printf("%d MICRO defines found\n", li);
  fclose(fp);
}

/*-------------------------------------------------------------------------
|-------------------------------------------------------------------------*/
void strip_trailing_sp(char *str)
{
  int sz;
  sz = strlen(str);
  if (sz == 0)
    return;
  while(str[sz-1] == ' ')
  {
    str[sz-1] = 0;
    --sz;
    if (sz == 0)
      return;
  }  
}

/*-------------------------------------------------------------------------
|-------------------------------------------------------------------------*/
void strip_eol(char *str)
{
  int sz;
#define is_eol_char(c) ((c == 0x0d) || (c == 0x0a))
  sz = strlen(str);
  if (sz == 0)
    return;
  if (is_eol_char(str[sz-1]))
    str[sz-1] = 0;

  sz = strlen(str);
  if (sz == 0)
    return;
  if (is_eol_char(str[sz-1]))
    str[sz-1] = 0;
}    

