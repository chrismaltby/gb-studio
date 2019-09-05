/*-------------------------------------------------------------------------
  tinitalk.c - A tini utility to download files to TINI and talk to it
  
  Written By - Johan Knol johan.knol@iduna.nl
  
  This program is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public License as published by the
  Free Software Foundation; either version 2, or (at your option) any
  later version.
  
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
  
  In other words, you are welcome to use, share and improve this program.
  You are forbidden to forbid anyone else to use, share and improve
  what you give them.   Help stamp out software-hoarding!  
  -------------------------------------------------------------------------*/

#if defined(_MSC_VER) || defined(__BORLANDC__)
#define TINI_PORT "COM2"
#else
#ifdef linux
// must be linux
#define TINI_PORT "/dev/ttyS0"
#else
// could be solaris
#define TINI_PORT "/dev/term/a"
#endif
#endif
#define TINI_BAUD 115200
#define TINI_ESCAPE_CHAR 0x1b

#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <fcntl.h>

#if !defined( _MSC_VER) && !defined(__BORLANDC__)
#include <unistd.h>
#include <termios.h>
#include <sys/ioctl.h>
#else
#include <conio.h>
#include <windows.h>
#define sleep(ms) Sleep((ms*1000))
#define usleep(us) Sleep((us/1000))
#endif

#include "tinitalk.h"

char *programName;
char escapeChar = 0;
char *port = NULL;
int baud = 0, appBaud = 0;

void
Usage ()
{
  fprintf (stderr, "usage: %s <options> command [args] \n", programName);
  fprintf (stderr, "\nwhere options are:\n");
  fprintf (stderr, "  <-p port> set the serial port, defaults to %s\n", TINI_PORT);
  fprintf (stderr, "  <-b baud> set the baud rate, defaults to %d\n", TINI_BAUD);
  fprintf (stderr, "  <-B baud> set the baud rate for the application\n");
  fprintf (stderr, "  <-c> connect to tini after command (if any)\n");
  fprintf (stderr, "  <-e #> to set the escape char\n");
  fprintf (stderr, "  <-s> to see some examples.\n");
  fprintf (stderr, "\nand commands are:\n");
  fprintf (stderr, "  <load file> load a hex file and restart the bootloader\n");
  fprintf (stderr, "  <execute [file]> load a hex file and/or start the program in bank 1\n");
  exit (1);
}

void
Examples ()
{
  printf ("\n");
  printf ("%s -p /dev/ttyS1\n", programName);
  printf ("    now you are talking to the bootloader through serial-1\n");
  printf ("%s -b 19200\n", programName);
  printf ("    now you are talking to the bootloader at 19200 baud\n");
  printf ("%s load tini.hex\n", programName);
  printf ("    load tini.hex\n");
  printf ("%s -c load tini.hex\n", programName);
  printf ("    after loading tini.hex you are talking to the bootloader\n");
  printf ("%s execute tini.hex\n", programName);
  printf ("    load tini.hex and start the program in bank 1\n");
  printf ("%s -c execute tini.hex\n", programName);
  printf ("    after loading the file you are talking to the (restarted)\n");
  printf ("    program in bank 1\n");
  printf ("%s execute\n", programName);
  printf ("    now the program in bank 1 is restarted.\n");
  printf ("%s -c execute\n", programName);
  printf ("    now you are talking to the (restarted) program in bank 1\n");
  printf ("%s -b 115200 -B 9600 -c execute tini.hex\n", programName);
  printf ("    download tini.hex at 115200 baud, but talk the program at 9600 baud\n");
  exit (0);
}

int
main (int argc, char **argv)
{
  int connect = 0;
  char command[64];

  int arg = 1;

  //programName=argv[0];
  programName = "tinitalk";

  // process options
  while (arg < argc && argv[arg][0] == '-')
    {

      // no arguments required
      if (argv[arg][1] == 'c')
	{
	  connect = 1;
	  arg++;
	  continue;
	}
      else if (argv[arg][1] == 's')
	{
	  Examples ();
	  // will not return
	}
      // argument required
      if (arg >= (argc - 1))
	{
	  Usage ();
	}
      switch (argv[arg][1])
	{
	case 'p':
	  port = argv[arg + 1];
	  break;
	case 'b':
	  baud = atoi (argv[arg + 1]);
	  break;
	case 'B':
	  appBaud = atoi (argv[arg + 1]);
	  break;
	case 'e':
	  escapeChar = atoi (argv[arg + 1]);
	  break;
	default:
	  Usage ();
	}
      arg += 2;
    }

  if (port == NULL)
    {
      if ((port = getenv ("TINI_PORT")) == NULL)
	{
	  port = TINI_PORT;
	}
    }
  if (baud == 0)
    {
      if (getenv ("TINI_BAUD"))
	{
	  baud = atoi (getenv ("TINI_BAUD"));
	}
      else
	{
	  baud = TINI_BAUD;
	}
    }
  if (escapeChar == 0)
    {
      if (getenv ("TINI_ESCAPE_CHAR"))
	{
	  escapeChar = atoi (getenv ("TINI_ESCAPE_CHAR"));
	}
      else
	{
	  escapeChar = TINI_ESCAPE_CHAR;
	}
    }
  if (appBaud == 0)
    {
      appBaud = baud;
    }
  if (!TiniOpen (port, baud))
    {
      exit (1);
    }
  // process commands
  while (arg < argc)
    {
      if (strcmp (argv[arg], "load") == 0)
	{
	  // argument required
	  if (arg >= (argc - 1))
	    {
	      Usage ();
	    }
	  if (LoadHexFile (argv[arg + 1]))
	    {
	      TiniReset (1);
	      if (connect)
		{
		  TiniConnect (baud);
		}
	    }
	  exit (0);
	}
      if (strcmp (argv[arg], "execute") == 0)
	{
	  // argument supplied?
	  if (arg < (argc - 1))
	    {
	      if (!LoadHexFile (argv[arg + 1]))
		{
		  exit (0);
		}
	    }
	  TiniReset (0);
	  if (connect)
	    {
	      TiniConnect (appBaud);
	    }
	  exit (0);
	}
      // unsupported command
      Usage ();
    }

  // no commands, just connect

  // on my linux box, DTR is always set after opening the port, so:
  // reset the bootloader

  strcpy (command, "r");

  while (1)
    {
      switch (tolower (command[0]))
	{
	case '?':
	case '\n':
	case 'h':
	  printf ("\n");
	  printf ("r - reset, start bootloader and connect to TINI\n");
	  printf ("e - reset, start program in bank 1 and connect to TINI\n");
	  printf ("c - connect to TINI.\n");
	  printf ("l - load file.\n");
	  printf ("s - save file.\n");
	  printf ("q - quit.\n");
	  break;
	case 'e':
	  TiniReset (0);
	  TiniConnect (appBaud);
	  break;
	case 'r':
	  TiniReset (1);
	  TiniConnect (baud);
	  break;
	case 'c':
	  // leave it as it was
	  TiniConnect (0);
	  break;
	case 'l':
	  {
	    char fileName[FILENAME_MAX] = "";
	    printf ("Enter filename: ");
	    fflush (stdout);
	    fgets (fileName, FILENAME_MAX, stdin);
	    // remove the EOL character
	    fileName[strlen (fileName) - 1] = 0;
	    LoadHexFile (fileName);
	  }
	  break;
	case 's':
	  printf ("Command \"%c\" not implemented yet.\n", command[0]);
	  break;
	case 'q':
	  return 0;
	  break;
	default:
	  printf ("Unknown command: \"%c\".\n", command[0]);
	  break;
	}
      printf ("\n<%s> ", programName);
      fflush (stdout);
#if defined(_MSC_VER) || defined(__BORLANDC__)
      // don't know why
      getch ();
#endif
      fgets (command, 64, stdin);
    }
  return 0;
}

int
LoadHexFile (char *path)
{
  FILE *hexFile;
  char hexLine[256];
  int bank = 0;
  int line = 0, type;
  char tempString[16];
  char c, ctrlC = 0x03;
  int bytesLoaded = 0, progress = 0;
  char banksZapped[8] =
  {0, 0, 0, 0, 0, 0, 0, 0};
  unsigned int address, bytes, i;
  unsigned int checksum, chk;

  if ((hexFile = fopen (path, "r")) == NULL)
    {
      perror (path);
      return 0;
    }
  TiniFlush ();

  while (fgets (hexLine, 256, hexFile))
    {

      if (TiniRead (&c, 1) == 1)
	{
	  // show error messages from TINI
	  printf ("\n");
	  do
	    {
	      putchar (c);
	    }
	  while (TiniRead (&c, 1) == 1);

	  printf ("\nInterrupted by loader.\n");
	  return 0;
	}
      line++;

      if (hexLine[0] != ':' ||
	  sscanf (&hexLine[1], "%02x", &bytes) != 1 ||
	  sscanf (&hexLine[3], "%04x", &address) != 1 ||
	  sscanf (&hexLine[7], "%02x", &type) != 1)
	{
	  printf ("Invalid ihx record: \"%s\"\n", hexLine);
	  TiniReset (1);
	  return 0;
	}
      // make sure line ends with '\r' or TINI won't swallow it
      hexLine[strlen (hexLine) - 1] = '\r';

      address += bank << 16;

      // test checksum
      checksum = 0;
      for (i = 0; i < bytes + 5; i++)
	{
	  sscanf (&hexLine[i * 2 + 1], "%02x", &chk);
	  checksum += chk;
	}
      if (checksum & 0xff)
	{
	  printf ("\nChecksum error at %06x (0x%02x!=0) in line: %d\n",
		  address, checksum&0xff, line);
	  TiniReset (1);
	  return 0;
	}
      if (type == 4)
	{
	  // new Hex386 record
	  sscanf (&hexLine[9], "%04x", &bank);
	  address = (address & 0xffff) + (bank << 16);
	  // just for safety
	  if (bank == 0)
	    {
	      printf ("==> No overwrite of bank 0 <==\n");
	      return 0;
	    }
	  if (0)
	    {
	      // interupt loader
	      TiniWriteAndWait (&ctrlC, 1, '>');
	    }
	  else
	    {
	      // reset TINI
	      TiniReset (1);
	    }
	  if (!banksZapped[bank])
	    {
	      // zap bank
	      sprintf (tempString, "z%d\r", bank);
	      TiniWriteAndWait (tempString, 3, '?');
	      TiniWriteAndWait ("y", 1, '\n');
	      printf ("[Zapping bank %d]\n", bank);
	      TiniWait ('>');
	      banksZapped[bank] = 1;
	      // start loader
	      //printf ("[Starting loader]\n");
	    }
	  TiniWriteAndWait ("l\r", 2, '\n');
	  printf ("[Loading bank %d]\n", bank);
	}
      if (bank > 0)
	{
	  if ((type == 0) && (1 || ((bytesLoaded / 1024) > progress)))
	    {
	      progress = bytesLoaded / 1024;
	      printf ("[%06x: sent %d bytes]\r", address, bytesLoaded);
	      fflush (stdout);
	    }
	  bytesLoaded += bytes;

	  //printf ("data: %s\n", hexLine);
	  TiniWrite ("            ", 12);
	  TiniWrite (hexLine, strlen (hexLine));
	  TiniDrain ();
	}
      else
	{
	  //printf ("skip: %s\n", hexLine);
	}
    }
  TiniWriteAndWait ("\r", 1, '>');
  printf ("\n[Load succesfull]\n");
  fclose (hexFile);
  return 1;
}

int
SaveFile (char *path)
{
  printf ("Saving file: %s\n", path);
  return 1;
}

/*
   this is the io part 
 */

#if defined(_MSC_VER) || defined(__BORLANDC__)
HANDLE tiniHandle;
DCB tiniDcb;
#else
static int tini_fd;
static int tini_status;
static struct termios tini_options;
#endif

static int initflag = 0;

int
TiniOpen (char *port, int baud)
{

  if (initflag)
    {
      return 1;
    }
  printf ("[Opening \"%s\" at \"%d\" baud, escape is 0x%02x]\n",
	  port, baud, escapeChar);

#if defined(_MSC_VER) || defined(__BORLANDC__)
  if ((tiniHandle = CreateFile (port, GENERIC_READ | GENERIC_WRITE, 0, NULL,
			     OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL)) ==
      INVALID_HANDLE_VALUE)
#else
  if ((tini_fd = open (port, O_RDWR | O_NOCTTY | O_NONBLOCK)) < 0)
#endif
    {
      fprintf (stderr, "%s: unable to open port %s - ",
	       "TiniOpen", port);
      perror("");
      return 0;
    }
  // configure the serial port
#if defined(_MSC_VER) || defined(__BORLANDC__)
  tiniDcb.DCBlength = sizeof (DCB);
  if (GetCommState (tiniHandle, &tiniDcb) != TRUE)
    {
      fprintf (stderr, "%s: unable to query port %s\n",
	       "TiniOpen", port);
      TiniClose ();
      return 0;
    }
  tiniDcb.StopBits = 0;
  tiniDcb.ByteSize = 8;
  tiniDcb.Parity = 0;
  tiniDcb.fDtrControl = DTR_CONTROL_DISABLE;
  tiniDcb.fRtsControl = RTS_CONTROL_DISABLE;
  tiniDcb.fOutxCtsFlow = FALSE;
  tiniDcb.fOutX = FALSE;
  tiniDcb.fInX = FALSE;
  if (SetCommState (tiniHandle, &tiniDcb) != TRUE)
    {
      fprintf (stderr, "%s: unable to configure port %s\n",
	       "TiniOpen", port);
      TiniClose ();
      return 0;
    }
  // reset DTR
  EscapeCommFunction (tiniHandle, CLRDTR);
#else
  if (ioctl (tini_fd, TIOCMGET, &tini_status))
    {
      perror ("0: ioctl(tini_fd, TIOCMGET, &tini_status) - ");
      TiniClose ();
      return 0;
    }
  // reset DTR
  tini_status &= ~TIOCM_DTR;
  if (ioctl (tini_fd, TIOCMSET, &tini_status))
    {
      perror ("2: ioctl(tini_fd, TIOCMSET, &tini_status) - ");
      TiniClose ();
      return 0;
    }
  tcgetattr (tini_fd, &tini_options);
  tini_options.c_cflag |= (CLOCAL | CREAD);
  tini_options.c_lflag &= ~(ISIG | ICANON | ECHO);
  tini_options.c_iflag |= (IGNCR);
  tini_options.c_cc[VMIN] = 0;
  tini_options.c_cc[VTIME] = 0;
  tcsetattr (tini_fd, TCSANOW, &tini_options);
#endif

  if (!TiniBaudRate (baud))
    {
      TiniClose ();
      return 0;
    }
  initflag = 1;
  return 1;
}

#if defined(_MSC_VER) || defined(__BORLANDC__)
#define B9600 CBR_9600
#define B19200 CBR_19200
#define B38400 CBR_38400
#define B57600 CBR_57600
#define B115200 CBR_115200
#endif

int
TiniBaudRate (int baud)
{
  int baudB;

  switch (baud)
    {
    case 9600:
      baudB = B9600;
      break;
    case 19200:
      baudB = B19200;
      break;
    case 38400:
      baudB = B38400;
      break;
    case 57600:
      baudB = B57600;
      break;
    case 115200:
      baudB = B115200;
      break;
    default:
      fprintf (stderr, "%s: illegal baudrate: \"%d\"\n", programName, baud);
      return 0;
    }

#if defined(_MSC_VER) || defined(__BORLANDC__)
  tiniDcb.BaudRate = baudB;
  SetCommState (tiniHandle, &tiniDcb);
#else
  cfsetispeed (&tini_options, baudB);
  cfsetospeed (&tini_options, baudB);
  tcsetattr (tini_fd, TCSANOW, &tini_options);
#endif

  return 1;
}

int
TiniReset (int toBootLoader)
{

  // set DTR
#if defined(_MSC_VER) || defined(__BORLANDC__)
  EscapeCommFunction (tiniHandle, SETDTR);
#else
  tini_status |= TIOCM_DTR;
  if (ioctl (tini_fd, TIOCMSET, &tini_status))
    {
      perror ("1: ioctl(tini_fd, TIOCMSET, &tini_status) - ");
      return 0;
    }
#endif

  // wait for 100ms
  usleep (100000);

  // drain input and output buffers
  TiniDrain ();

  // reset DTR
#if defined(_MSC_VER) || defined(__BORLANDC__)
  EscapeCommFunction (tiniHandle, CLRDTR);
#else
  tini_status &= ~TIOCM_DTR;
  if (ioctl (tini_fd, TIOCMSET, &tini_status))
    {
      perror ("2: ioctl(tini_fd, TIOCMSET, &tini_status) - ");
      return 0;
    }
#endif

  // wait for 100ms
  usleep (100000);

  if (TiniWrite ("\r", 1) != 1)
    {
      fprintf (stderr, "TiniReset: couldn't write to tini\n");
      return 0;
    }
  // wait for the bootloader prompt
  // we should build a timeout here
  TiniWait ('>');

  if (toBootLoader)
    {
      return 1;
    }
  TiniWriteAndWait ("E\r", 2, 'E');
  return 1;
}

#if defined(_MSC_VER) || defined(__BORLANDC__)
// read as much character as available, at most n
int
TiniRead (char *buffer, int n)
{
  int count;
  int status;
  COMSTAT tiniComStat;

  ClearCommError (tiniHandle, &status, &tiniComStat);
  if (tiniComStat.cbInQue < (unsigned int) n)
    {
      n = tiniComStat.cbInQue;
    }
  ReadFile (tiniHandle, buffer, n, &count, NULL);

  return count;
}

int
TiniWrite (char *buffer, int n)
{
  int count;
  WriteFile (tiniHandle, buffer, n, &count, NULL);
  return count;
}
#else
int
TiniRead (char *buffer, int n)
{
  return read (tini_fd, buffer, n);
}

int
TiniWrite (char *buffer, int n)
{
  return write (tini_fd, buffer, n);
}
#endif

// wait for the prompChar
int
TiniWait (char promptChar)
{
  char c;
  while (1)
    {
      switch (TiniRead (&c, 1))
	{
	case 0:		// no char available
	  // give up our time slice

	  sleep (0);
	  break;
	case 1:		// one char read

	  putchar (c);
	  fflush (stdout);
	  if (c == promptChar)
	    {
	      return 1;
	    }
	  break;
	default:		// some error

	  perror ("TiniWait: ");
	  return 0;
	  break;
	}
    }
}

// send the buffer and wait for the promptChar
int
TiniWriteAndWait (char *buffer, int n, char promptChar)
{
  char bytes = TiniWrite (buffer, n);
  TiniWait (promptChar);
  return bytes;
}

// flush input and output buffers (wait for it)
void
TiniFlush ()
{
#if defined(_MSC_VER) || defined(__BORLANDC__)
  FlushFileBuffers (tiniHandle);
#else
  // flush the buffers, isn't there a simpler way?
  tcsetattr (tini_fd, TCSAFLUSH, &tini_options);
#endif
}

// drain input and output buffers (forget it)
void
TiniDrain ()
{
#if defined(_MSC_VER) || defined(__BORLANDC__)
  PurgeComm (tiniHandle, PURGE_TXCLEAR | PURGE_RXCLEAR);
#else
  // drain the buffers, isn't there a simpler way?
  tcsetattr (tini_fd, TCSADRAIN, &tini_options);
#endif
}

#if defined(_MSC_VER) || defined(__BORLANDC__)
void
TiniConnect (int baud)
{
  char c;

  if (baud)
    {
      TiniBaudRate (baud);
    }

  while (1)
    {
      if (TiniRead (&c, 1))
	{
	  // char from TINI, high priority
	  putchar (c);
	  fflush (stdout);
	}
      else if (kbhit ())
	{
	  // char from console, low priotity
	  if ((c = getch ()) == escapeChar)
	    {
	      // escape from connect?
	      printf ("<ESC>");
	      break;
	    }
	  TiniWrite (&c, 1);
	}
      else
	{
	  // nothing to do, so give up our timeslice
	  sleep (0);
	}
    }
}
#else
void
TiniConnect (int baud)
{
  struct termios options, consoleOptions;
  int consoleFlags;
  char c;
  int fno;

  if (baud)
    {
      TiniBaudRate (baud);
    }

  // set stdin to nonblocking IO, noecho
  fno = fileno (stdin);
  consoleFlags = fcntl (fno, F_GETFL);
  fcntl (fno, F_SETFL, consoleFlags | O_NONBLOCK);

  tcgetattr (fno, &consoleOptions);
  options = consoleOptions;
  options.c_lflag &= ~(ISIG | ICANON | ECHO);
  tcsetattr (fno, TCSANOW, &options);

  while (1)
    {
      if (TiniRead (&c, 1) == 1)
	{
	  // char from TINI, high priority
	  putchar (c);
	}
      else if ((c = getchar ()) != EOF)
	{
	  // char from console, low priority
	  if (c == escapeChar)
	    {
	      // escape from connect?
	      break;
	    }
	  if (c == '\n')
	    {
	      c = '\r';
	    }
	  TiniWrite (&c, 1);
	}
      else
	{
	  // nothing to do, so give up our timeslice
	  sleep (0);
	}
    }

  // reset stdin
  fcntl (fno, F_SETFL, consoleFlags);
  tcsetattr (fno, TCSANOW, &consoleOptions);
}
#endif

void
TiniClose (void)
{
  initflag = 0;
#if defined(_MSC_VER) || defined(__BORLANDC__)
  CloseHandle (tiniHandle);
#else
  close (tini_fd);
#endif
}
